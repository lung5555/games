import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CircularProgress from '@mui/material/CircularProgress';
import NativeSelect from '@mui/material/NativeSelect';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';

const GamesGrid = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState([]);
    const [discountRecords, setDiscountRecords] = useState([]);
    const [searching, setSearching] = useState(false);
    
    const [anchorEl, setAnchorEl] = useState([]);
    const [isLoadingDiscount, setIsLoadingDiscount] = useState(true);
    
    const searchQuery = useRef('');
    const sortBy = useRef('-discountStartAt');
    const page = useRef(0);
    const fetchingData = useRef(false);
    const haveNext = useRef(true);

    useEffect(async () => {
        // console.log("1st useEffect");
        await fetchData(searchQuery.current, page.current, sortBy.current);
    }, []);

    function randomString(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    }

    const fetchData = async (searchQuery, pageNo, sortBy) => {
        // console.log("fetching pageNo:", pageNo, "searchQuery:", searchQuery, "sortBy:", sortBy);

        fetchingData.current = true;
        try {
            const response = await axios.get(`/api/games?pageNo=${pageNo + 1}&pageSize=50` + (sortBy ? ('&sortBy=' + sortBy) : '') + (searchQuery ? ('&q=' + searchQuery) : ''));
            if (response.data.length < 10) {
                haveNext.current = false;
            }
            setData((prev) => [...prev, ...response.data]);
            setIsLoading(false);
            fetchingData.current = false;
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    const fetchDiscounts = async (gameId, pageNo) => {
        // console.log("fetching discount gameId:", gameId, "pageNo:", pageNo);

        try {
            const response = await axios.get(`/api/games/${gameId}/discount-records?pageNo=${pageNo + 1}&pageSize=10`);
            setDiscountRecords(response.data);
            setIsLoadingDiscount(false);
        } catch (error) {
            console.error('Failed to fetch discounts:', error);
        }
    };

    const handleSearch = async (query) => {
        if (fetchingData.current) {
            return;
        }

        // console.log("handleSearch: ", query);
        searchQuery.current = query;
        page.current = 0;
        setData([]);
        setIsLoading(true)
        await fetchData(query, 0, sortBy.current);
    };

    const handleSearchClear = async () => {
        if (fetchingData.current) {
            return;
        }

        // console.log("handleSearchClear");
        searchQuery.current = '';
        setSearching(false);
        page.current = 0;
        setData([]);
        setIsLoading(true)
        await fetchData('', 0, sortBy.current);
    };

    const handleSearchIconClick = () => {
        setSearching(true);
    };

    const handleSortChange = async (event) => {
        if (fetchingData.current) {
            return;
        }

        // console.log("handleSortChange");
        sortBy.current = event.target.value;
        page.current = 0;
        setData([]);
        setIsLoading(true)
        await fetchData(searchQuery.current, 0, event.target.value);
    };

    const handleScroll = async () => {
        // console.log("handleScroll:", fetchingData.current, window.innerHeight, window.scrollY, document.body.offsetHeight)
        if (!fetchingData.current &&
            (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1.5 * window.innerHeight) &&
            haveNext.current) {
            // console.log("fetchingData.current:", fetchingData.current, "haveNext.current:", haveNext.current);

            // console.log("2nd useEffect");

            // fetchingData.current = true;
            page.current = page.current + 1;
            setIsLoading(true);
            await fetchData(searchQuery.current, page.current, sortBy.current);
        }
    };

    const handlePopoverOpen = (gameId) => async (event) => {
        // console.log("handlePopoverOpen gameId:", gameId)
        setAnchorEl((prev) => {
            prev[gameId] = event.currentTarget;
            return prev;
        });
        setIsLoadingDiscount(true);
        await fetchDiscounts(gameId, 0);
    };

    const handlePopoverClose = (gameId) => () => {
        setAnchorEl([]);
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        }
    }, []);

    function getCurrentPriceLabel(data) {
        return <Grid container justifyContent="space-between" alignItems="flex-end">
            <Grid item>
                <Typography variant="h5" sx={{ padding: "0 0 0 5px" }} display="inline">
                    <span style={{ color: '#ed934e' }}><b>${data.currentPrice}</b></span>
                </Typography>
            </Grid>
            <Grid item>
                {getCheapestPriceLabel(data)}
            </Grid>
        </Grid>
    }

    function getCheapestPriceLabel(data) {
        if (!data.cheapestPriceEndAt || !data.cheapestPrice) {
            return;
        }

        const dateLabel = data.cheapestPriceEndAt ? new Date(Date.parse(data.cheapestPriceEndAt)).toLocaleDateString('zh-HK') : '-';
        return (<div>
            <Button aria-describedby={anchorEl[data.id]} onClick={handlePopoverOpen(data.id)} sx={{ padding: "0 5px 0 5px" }}>
                <Typography variant="caption" display="inline">
                    <span style={{ color: '#8f8f8f' }}>${data.cheapestPrice} ({dateLabel})</span>
                </Typography>
            </Button>
            <Popover
                id={anchorEl[data.id]}
                open={Boolean(anchorEl[data.id])}
                anchorEl={anchorEl[data.id]}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                onClose={handlePopoverClose(data.id)}
            >
                {isLoadingDiscount && <CircularProgress sx={{ padding: "10px 0" }} />}
                {Boolean(anchorEl[data.id]) && discountRecords.map(function (item) {
                    return (<Typography variant="caption" display="inline" key={randomString(10)}>
                        <span style={(data.cheapestPrice == item.discountPrice) ? { color: '#f27979' } : { color: '#8f8f8f' }}>${item.discountPrice} ({new Date(Date.parse(item.discountEndAt)).toLocaleDateString('zh-HK')})</span><br></br>
                    </Typography>);
                })}
            </Popover>
        </div>);
    }

    function getPriceLabel(data) {
        if (!data.discountRate) {
            return <Grid container alignItems="flex-end">
                <Grid item xs={12} sm={12} md={12} lg={12} >
                    {getCurrentPriceLabel(data)}
                </Grid>
            </Grid>;
        }

        const startAtLabel = data.discountStartAt ? new Date(Date.parse(data.discountStartAt)).toLocaleDateString('zh-HK') : '-';
        const endAtLabel = data.discountEndAt ? new Date(Date.parse(data.discountEndAt)).toLocaleDateString('zh-HK') : '-';

        return (<Grid container alignItems="flex-end">
            <Grid item xs={12} sm={12} md={12} lg={12}>
                <Typography variant="subtitle2" sx={{ padding: "0 5px" }} >
                    <span style={{ color: '#999999' }}>{startAtLabel} ~ {endAtLabel} </span>
                </Typography>
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={12} >
                <Typography variant="body1" sx={{ padding: "0 0 0 5px" }} >
                    <span style={{ color: '#c4c4c4', textDecoration: 'line-through' }}><b>${data.regularPrice}</b></span>
                    <span style={{ color: '#eb5252' }}> (↓{data.discountRate}%)</span>
                </Typography>
                {getCurrentPriceLabel(data)}
            </Grid>
        </Grid>);
    }

    return (
        <div>
            <AppBar position="sticky" sx={{ bgcolor: "#42a5f5" }}>
                <Toolbar>
                    <Grid container justifyContent="space-between" alignItems="center">
                        <Grid item>
                            {searching ?
                                (
                                    <TextField
                                        placeholder="搜尋"
                                        variant="standard"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={handleSearchClear}
                                                        onMouseDown={handleSearchClear}
                                                        edge="end"
                                                    >
                                                        <ClearIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                        returnKeyType='search'
                                        autoFocus={true}
                                        defaultValue={searchQuery.current}
                                        onKeyUp={(e) => {
                                            if (e.key === 'Enter') {
                                                handleSearch(e.target.value);
                                            }
                                        }}
                                        onSubmitEditing={(e) => handleSearch(e.target.value)}
                                    />
                                ) : (
                                    <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleSearchIconClick}>
                                        <SearchIcon />
                                    </IconButton>
                                )}
                        </Grid>
                        <Grid item>
                            <NativeSelect value={sortBy.current} onChange={handleSortChange}>
                                <option value="-discountStartAt">最新優惠</option>
                                <option value="discountEndAt">就完優惠</option>
                                <option value="currentPrice">售價</option>
                                <option value="-discountRate">折扣</option>
                            </NativeSelect>
                        </Grid>
                    </Grid>
                </Toolbar>
            </AppBar>
            <Container sx={{ padding: "0 0" }}>
                <Grid container justifyContent="center" alignItems="center" spacing={0.5} >
                    {data.map((item) => (
                        <Grid item xs={12} sm={6} md={6} lg={6} key={item.id}>
                            <Card>
                                <Grid container >
                                    <Grid item xs={6} sm={6} md={6} lg={6}>
                                        <CardActionArea href={item.link} target="_blank" referrerPolicy="no-referrer" >
                                            {/* style={{ width: (window.innerWidth > 600 ? 600 : window.innerWidth), height: 'auto' }} */}
                                            <CardMedia component="img" sx={{ objectFit: "contain" }} image={item.image} alt={item.name} referrerPolicy="no-referrer" />
                                        </CardActionArea>
                                    </Grid>
                                    <Grid container item xs={6} sm={6} md={6} lg={6}>
                                        <Grid item xs={12} sm={12} md={12} lg={12}>
                                            <Typography variant="body2" sx={{ padding: "0 5px", display: "-webkit-box", overflow: "hidden", textOverflow: "ellipsis", WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.name}</Typography>
                                        </Grid>
                                        {getPriceLabel(item)}
                                    </Grid>
                                </Grid>
                            </Card>
                        </Grid>
                    ))}
                    {isLoading && <Grid item justifyContent="center" alignItems="center"><CircularProgress sx={{ padding: "10px 0" }} /></Grid>}
                </Grid>
            </Container>
        </div >
    );
};

export default GamesGrid;