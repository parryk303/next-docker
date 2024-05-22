import { TextField, Button, Typography, AppBar, Toolbar, Container, Box, CircularProgress, Select, MenuItem } from '@mui/material';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const accessToken = Cookies.get('access');
  console.log('INTERCEPT: ', accessToken);
  if (accessToken) {
    config.headers.Authorization = `Bearer token ${accessToken}`;
  }
  return config;
});

const examples = {
  monday: '{ users { id name email } }',
  salesforce: `SELECT Id, IsDeleted, Name, CurrencyIsoCode, CreatedDate, CreatedById, LastModifiedDate, LastModifiedById, SystemModstamp, LastViewedDate, LastReferencedDate, AccountId, Type, ServiceContractId, ContractLineItemId, AssetId, StartDate, EndDate, SlaProcessId, BusinessHoursId, IsPerIncident, CasesPerEntitlement, RemainingCases, Status FROM Entitlement WHERE Name LIKE '%Adams and Reese LLP%'`,
  smartsheet: 'getSheetAsJSON(2888478287155076)'
}

export default function Home() {
  const [showProgress, setShowProgress] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [source, setSource] = useState('salesforce');
  const [hasCookie, setHasCookie] = useState(false);
  const [query, setQuery] = useState(examples['salesforce']);
  const [get, setGet] = useState(true);
  const [data, setData] = useState();

  useEffect(() => {
    const checkCookie = async () => {
      const result = Cookies.get('access') !== undefined;
      setHasCookie(result);
      return result;
    };

    const fetchJWT = async () => {
      const hasAccess = await checkCookie();
      if (!hasAccess) {
        window.location.replace('./login');
      };
      setGet(false);
    };

    if (get) {
      fetchJWT();
      setGet(false);
    }
    if (isSearching) {
      handleSearch();
    }
  }, [get, data, isSearching, showProgress]);


  const handleSearch = async () => {
    try {
      const result = await api.post(`/api/${source}`, { query: query });
      setData(result.data);
      setQuery('');
    } catch (error) {
      console.error(`Error with ${source} API request: `, error);
    }
    setShowProgress(false);
    setIsSearching(false);
  };

  const handleSourceChange = event => { setSource(event.target.value); setQuery(examples[event.target.value]) };
  const handleInputChange = event => setQuery(event.target.value);
  return (
    <div>
      <AppBar position='static'>
        <Toolbar>
          <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
            Managed Services - Ballance Sheet Tracking
          </Typography>
        </Toolbar>
      </AppBar>
      {hasCookie && (
        <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 3, marginTop: 5, width: '80vw' }}>
            <Select
              value={source}
              onChange={handleSourceChange}
              sx={{ width: '10vw', marginRight: '20px' }}
            >
              <MenuItem value='salesforce'>Salesforce</MenuItem>
              <MenuItem value='monday'>Monday</MenuItem>
              <MenuItem value='smartsheet'>Smartsheet</MenuItem>
            </Select>
            <TextField
              label='Query'
              variant='outlined'
              value={query}
              onChange={handleInputChange}
              sx={{ width: '45vw', marginRight: '20px' }}
            />
            <Button sx={{ marginRight: '20px' }} disabled={query === ''} variant='contained' color='primary' onClick={() => { setIsSearching(true); setShowProgress(true) }}>
              Search
            </Button>
            {showProgress &&
              <CircularProgress />
            }
          </Box>
          {data && (
            <>
              <Typography variant='h6' mt={2}>
                Response Data:
              </Typography>
              <Box sx={{ display: 'flex', width: '90vw', border: 'solid', borderColor: 'lightgray', padding: '25px', marginTop: 2 }}>
                <pre>{JSON.stringify(data, null, 2)}</pre>
              </Box>
            </>
          )}
        </Container>
      )}
    </div>

  );
}
