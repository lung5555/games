import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('discountStartAt');
  const [sortByDirection, setSortByDirection] = useState('desc');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  useEffect(() => {
    fetchData();
  }, []);

  const headCells = [
    { id: 'name', numeric: false, disablePadding: true, label: '' },
    { id: 'currentPrice', numeric: true, disablePadding: true, label: '售價' },
    // { id: 'regularPrice', numeric: true, disablePadding: true, label: '原價' },
    { id: 'discountRate', numeric: true, disablePadding: true, label: '折扣' },
    { id: 'discountStartAt', numeric: false, disablePadding: true, label: '優惠由' },
    { id: 'discountEndAt', numeric: false, disablePadding: true, label: '優惠至' },
    { id: 'cheapestPrice', numeric: true, disablePadding: true, label: '最低價(日期)' },
    // { id: 'cheapestPriceEndAt', numeric: false, disablePadding: true, label: '最低價日期' },
  ]

  const fetchData = async () => {
    try {
      const response = await axios.get(`/api/games?pageNo=${page}&pageSize=${rowsPerPage}` + (sortBy ? ('&sortBy=' + (sortByDirection === 'desc' ? '-' : '') + sortBy) : ''));
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSearch = (event) => {
    // fetchData();
  };

  const handleChangeSort = (event, sortKey) => {
    setSortByDirection((sortBy === sortKey && sortByDirection === 'asc') ? 'desc' : 'asc')
    setSortBy(sortKey)
  };

  const handleChangePage = (event, page) => {
    setPage(page);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 50));
    setPage(1);
  };

  const changeSortHandler = (sortKey) => (event) => {
    handleChangeSort(event, sortKey)
  }

  function getDisplayPrice(currentPrice, regularPrice) {
    if (currentPrice >= regularPrice) {
      return '$' + currentPrice
    }

    return <><span style={{ color: '#ed934e' }}><b>${currentPrice}</b></span><br /><span style={{ textDecoration: 'line-through' }}>${regularPrice}</span></>
  }

  return (
    <div>
      <TextField
        label="Search"
        value={searchQuery}
      // onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={handleSearch}>
        Search
      </Button>
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  padding={headCell.disablePadding ? 'none' : 'normal'}
                  scope="row"
                  align="center"
                  sortDirection={sortBy === headCell.id ? sortByDirection : false}
                >
                  <TableSortLabel
                    active={sortBy === headCell.id}
                    direction={sortBy === headCell.id ? sortByDirection : 'asc'}
                    onClick={changeSortHandler(headCell.id)}
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell><a href={item.link} target="_blank">
                  <img src={item.image} /><br />{item.name}
                </a></TableCell>
                <TableCell>{getDisplayPrice(item.currentPrice, item.regularPrice)}</TableCell>
                {/* <TableCell>{item.regularPrice}</TableCell> */}
                <TableCell>{item.discountRate ? (<span style={{ color: '#eb5252' }}>↓{item.discountRate}%</span>) : 'N/A'}</TableCell>
                <TableCell>{item.discountStartAt ? new Date(Date.parse(item.discountStartAt)).toLocaleDateString('zh-HK') : 'N/A'}</TableCell>
                <TableCell>{item.discountEndAt ? new Date(Date.parse(item.discountEndAt)).toLocaleDateString('zh-HK') : 'N/A'}</TableCell>
                <TableCell>{item.cheapestPrice ? ('$' + item.cheapestPrice + (' (' + (item.cheapestPriceEndAt && new Date(Date.parse(item.cheapestPriceEndAt)).toLocaleDateString('zh-HK')) + ')')) : 'N/A'}</TableCell>
                {/* <TableCell>{item.cheapestPriceEndAt ? new Date(Date.parse(item.cheapestPriceEndAt)).toLocaleDateString('zh-HK') : 'N/A'}</TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default App;