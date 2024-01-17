
const express = require('express')
const path = require("path");
const app = express()

const CyclicDB = require('@cyclic.sh/dynamodb')
const db = CyclicDB(process.env.CYCLIC_DB)
const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

const gamesCollection = db.collection("games");
const gameDiscountRecordsCollection = db.collection("game_discount_records");

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// #############################################################################
// This configures static hosting for files in /public that have the extensions
// listed in the array.
var options = {
    dotfiles: 'ignore',
    etag: false,
    extensions: ['htm', 'html', 'css', 'js', 'ico', 'jpg', 'jpeg', 'png', 'svg'],
    index: ['index.html'],
    maxAge: '1m',
    redirect: false
}
app.use(express.static('build', options))


// List
app.get('/api/games', async (req, res) => {
    console.log(req.protocol + '://' + req.get('host') + req.originalUrl);

    const pageNo = req.query.pageNo ?? 1;
    const pageSize = req.query.pageSize ?? 20;
    let sortBy = req.query.sortBy ?? '-discountStartAt';
    const records = await gamesCollection.filter()
    res.json(sortByKey(records?.results?.map(record => record?.props), sortBy)?.slice((pageNo - 1) * pageSize, (pageNo - 1) * pageSize + pageSize))
})

// Get game's discount records
app.get('/api/games/:id/discount-records', async (req, res) => {
    console.log(req.protocol + '://' + req.get('host') + req.originalUrl);

    const id = req.params.id.toString()
    let sortBy = req.query.sortBy ?? '-created';
    const records = await gameDiscountRecordsCollection.filter({ gameId: id })
    res.json(sortByKey(records?.results?.map(record => record?.props), sortBy))
})

// Get single game
app.get('/api/games/:id', async (req, res) => {
    console.log(req.protocol + '://' + req.get('host') + req.originalUrl);

    const id = req.params.id.toString()
    const records = await gamesCollection.get(id)
    res.json(records?.props ?? null)
})

function sortByKey(arr, sortBy) {
    if (!arr) {
        return arr;
    }

    const isDesc = sortBy[0] === '-';
    if (isDesc) {
        sortBy = sortBy.substring(1);
    }
    return arr.sort((a, b) => {
        if (!a[sortBy]) {
            return 1;
        } else if (!b[sortBy]) {
            return -1;
        }

        if (a[sortBy] < b[sortBy]) {
            return isDesc ? 1 : -1;
        } else if (a[sortBy] > b[sortBy]) {
            return isDesc ? -1 : 1;
        }

        return 0;
    })
}

// Update
app.post('/api/games', async (req, res) => {
    const startPage = req.body.startPage ?? 1;
    updateGamePrices(startPage)
        .then(nextPage => {
            res.json({ nextPage: nextPage ?? null });
        });
});

async function updateGamePrices(startPage = 1, timeout = 25 * 1000) {
    const startTime = Date.now();
    let priceUrl = process.env.GAME_LIST_URL + '?product_list_limit=24&p=' + startPage.toString();

    while (priceUrl && Date.now() - startTime < timeout) {
        // console.log(`getting data from ${priceUrl}`);
        const $ = cheerio.load((await axios.get(priceUrl)).data);
        const gameList = $('.product-item-info');
        const gameNameMap = new Map();

        gameList.each(async (index, element) => {
            const gameLink = $(element).find('.product-item-photo').attr('href');
            const gameId = gameLink.split('/').pop();
            const gameImage = $(element).find('.product-image-photo').attr('data-src');
            const gameName = $(element).find('.product-item-link').text().trim();
            gameNameMap.set(gameId, { name: gameName, image: gameImage, link: gameLink });
        });

        if (gameNameMap.size <= 0) {
            console.log("No more...")
            return;
        }

        const priceInfoUrl = process.env.GAME_PRICE_INFO_URL + '?' + process.env.GAME_PRICE_INFO_PARAM + '=' + Array.from(gameNameMap.keys()).join('&' + process.env.GAME_PRICE_INFO_PARAM + '=');
        // console.log(`getting price info from ${priceInfoUrl}`);
        const priceInfoList = (await axios.get(priceInfoUrl)).data;
        priceInfoList.forEach(async priceInfo => {
            const regularPrice = priceInfo.price.regular_price?.raw_value ? parseInt(priceInfo.price.regular_price?.raw_value) : null;
            const discountPrice = priceInfo.price.discount_price?.raw_value ? parseInt(priceInfo.price.discount_price?.raw_value) : null;
            const discountStartAt = priceInfo.price.discount_price?.start_datetime;
            const discountEndAt = priceInfo.price.discount_price?.end_datetime;
            const currentPrice = discountPrice ?? regularPrice;
            // console.log(`current: ${currentPrice}, discount: ${discountPrice} (${discountStartAt} - ${discountEndAt})`);

            const gameId = priceInfo.id.toString();
            if (!gameNameMap.get(gameId)) {
                console.log("Cannot get game from map!")
                return;
            }

            let game = (await gamesCollection.get(gameId))?.props;
            if (discountPrice && (game?.discountEndAt != discountEndAt)) {
                // create discount record
                // console.log("create discount records: ", gameId)
                await gameDiscountRecordsCollection.set(uuidv4(), {
                    gameId: gameId,
                    regularPrice: regularPrice,
                    discountPrice: discountPrice ?? null,
                    discountRate: discountPrice ? Math.round(100 - discountPrice * 100 / regularPrice) : null,
                    discountStartAt: discountStartAt ?? null,
                    discountEndAt: discountEndAt ?? null,
                }, {
                    $index: ['gameId', 'discountStartAt']
                });
            }

            if (!game || game.currentPrice != currentPrice || parseInt(game.cheapestPrice) > currentPrice) {
                // create or update
                // console.log("create/update game: ", gameId)
                game = {
                    id: gameId,
                    image: gameNameMap.get(gameId)?.image,
                    name: gameNameMap.get(gameId)?.name,
                    link: gameNameMap.get(gameId)?.link,
                    currentPrice: currentPrice,
                    regularPrice: regularPrice,
                    discountRate: discountPrice ? Math.round(100 - discountPrice * 100 / regularPrice) : null,
                    discountStartAt: discountStartAt ?? null,
                    discountEndAt: discountEndAt ?? null,
                    cheapestPrice: (game?.cheapestPrice ? parseInt(game?.cheapestPrice) : Infinity) > currentPrice ? currentPrice : parseInt(game?.cheapestPrice),
                    cheapestPriceEndAt: (game?.cheapestPrice ? parseInt(game?.cheapestPrice) : Infinity) > currentPrice ? discountEndAt : game?.cheapestPriceEndAt,
                };
                await gamesCollection.set(gameId, game, {
                    $index: ['discountStartAt', 'discountEndAt', 'discountRate']
                });
            }
        });

        await new Promise(r => setTimeout(r, 200));
        priceUrl = $('.pages-item-next > .next').attr('href');
    }

    return priceUrl ? (new URL(priceUrl)).searchParams?.get('p') : null;
}

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`React app listening at http://localhost:${port}`)
})