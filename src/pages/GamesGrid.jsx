import React, { useState, useEffect } from 'react';
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
import SearchIcon from '@mui/icons-material/Search';
import CircularProgress from '@mui/material/CircularProgress';

const GamesGrid = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('-discountStartAt');
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);

    useEffect(() => {
        fetchData(searchQuery, page, sortBy);
    }, []);

    const fetchData = async (searchQuery, pageNo, sortBy) => {
        try {
            const response = await axios.get(`/api/games?pageNo=${pageNo + 1}&pageSize=100` + (sortBy ? ('&sortBy=' + sortBy) : '') + (searchQuery ? ('&q=' + searchQuery) : ''));
            setData(response.data);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    const handleScroll = () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
            setPage((prevPage) => prevPage + 1);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    function getDisplayPrice(currentPrice, regularPrice) {
        if (currentPrice >= regularPrice) {
            return (<Grid item>
                <Typography variant="h5" align="right" component="div">
                    ${currentPrice}
                </Typography>
            </Grid>);
        }

        return (<Grid item sx={{ alignSelf: 'flex-end' }}>
            <Typography variant="h5" align="right" component="div">
                <span style={{ color: '#ed934e' }}><b>${currentPrice}</b></span>
            </Typography>
            <Typography variant="body1" align="right" component="div">
                <span style={{ textDecoration: 'line-through' }}>${regularPrice}</span>
            </Typography>
        </Grid>);
    }

    function getDiscountLabel(regularPrice, discountRate, startAt, endAt) {
        if (!discountRate) {
            return;
        }

        const startAtLabel = startAt ? new Date(Date.parse(startAt)).toLocaleDateString('zh-HK') : '-';
        const endAtLabel = endAt ? new Date(Date.parse(endAt)).toLocaleDateString('zh-HK') : '-';

        return (<Grid container justifyContent="space-between">
            <Grid item xs={8}>
                <Typography variant="body2" sx={{ padding: "0 5px" }} >
                    優惠期: {startAtLabel} ~ {endAtLabel}
                </Typography>
            </Grid>
            <Grid item xs={4}>
                <Typography variant="h6" align="right" >
                    <span style={{ color: '#eb5252' }}>(↓{discountRate}%) </span>
                    <span style={{ textDecoration: 'line-through' }}>${regularPrice}</span>
                </Typography>
                <Typography variant="body1" align="right" >

                </Typography>
            </Grid>
        </Grid>);
    }

    const handleSearch = () => {
        setPage(1);
        setData([]);
        fetchData();
    };

    const handleSortChange = (event) => {
        // setSortOption(event.target.value);
    };

    return (
        <div>
            <AppBar position="sticky">
                <Toolbar>
                    <IconButton edge="start" color="inherit" aria-label="menu">
                        <SearchIcon />
                    </IconButton>
                    <TextField
                        label="Search"
                        variant="outlined"
                    // value={searchTerm}
                    // onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </Toolbar>
            </AppBar>
            <Container sx={{ padding: "0 0" }} >
                <Grid container justifyContent="flex-start" alignItems="center" spacing={1} >
                    {isLoading && <Grid item justifyContent="center" alignItems="center"><CircularProgress sx={{ padding: "10px 0" }} /></Grid>}
                    {data.map((item) => (
                        <Grid item xs={12} sm={12} md={12} lg={12} key={item.id}>
                            <Card>
                                <Grid container>
                                    <Grid item xs={12} sm={6} md={6} lg={6}>
                                        <CardActionArea href={item.link} target="_blank" referrerPolicy="no-referrer" >
                                            {/* style={{ width: (window.innerWidth > 600 ? 600 : window.innerWidth), height: 'auto' }} */}
                                            <CardMedia component="img" sx={{ objectFit: "contain" }} image={item.image} alt={item.name} referrerPolicy="no-referrer" />
                                        </CardActionArea>
                                    </Grid>
                                    <Grid container sm={6} md={6} lg={6}>
                                        <Grid item xs={10} sm={12} md={12} lg={12}>
                                            <Typography variant="body1" sx={{ padding: "0 5px" }}>{item.name}</Typography>
                                        </Grid>
                                        <Grid item xs={2} sm={12} md={12} lg={12} >
                                            <Typography variant="h5" sx={{ padding: "0 5px" }} align="right" >
                                                <span style={{ color: '#ed934e' }}><b>${item.currentPrice}</b></span>
                                            </Typography>
                                        </Grid>
                                        {getDiscountLabel(item.regularPrice, item.discountRate, item.discountStartAt, item.discountEndAt)}
                                    </Grid>
                                </Grid>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </div>
    );
};

export default GamesGrid;