import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

const GamesV2 = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('discountStartAt');
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);

    useEffect(() => {
        fetchData(searchQuery, page, sortBy);
    }, []);

    const fetchData = async (searchQuery, pageNo, sortBy) => {
        try {
            const response = await axios.get(`/api/games?pageNo=${pageNo + 1}&pageSize=100` + (sortBy ? ('&sortBy=' + sortBy) : '') + (searchQuery ? ('&q=' + searchQuery) : ''));
            setData(response.data);
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
            <Container>
                <Grid container direction="column" justifyContent="center" alignItems="center" spacing={1}>
                    {data.map((item) => (
                        <Grid item xs={12} sm={8} md={6} lg={4} key={item.id}>
                            <Card>
                                <CardMedia component="img" height="200" image={item.image} alt={item.name} crossOrigin="anonymous" />
                                <CardContent>
                                    <Typography variant="h6">{item.title}</Typography>
                                    <Typography variant="body2">{item.description}</Typography>
                                    <Typography variant="body2">{item.date}</Typography>
                                    <Typography variant="body2">{item.author}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </div>
    );
};

export default GamesV2;