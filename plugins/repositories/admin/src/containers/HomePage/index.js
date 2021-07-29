import React, { memo, useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { Table } from '@buffetjs/core';
import { Header } from '@buffetjs/custom';


const Wrapper = styled.div`
  padding: 18px 30px;

  p {
    margin-top: 1rem;
  }
`;

const header = [
  {
    name: 'Name',
    value: 'name'
  },,
  {
    name: 'Description',
    value: 'description'
  },
  {
    name: 'Url',
    value: 'html_url'
  }
];

const HomePage = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    axios.get('https://api.github.com/users/laugustofrontend/repos')
      .then(res => {
        const repos = res.data;

        repos.map(({ name, description, html_url }) => {
          setRows([ ...repos, { name, description, html_url } ]);
        });
      })
      .catch(err => strapi.notification.error(`Ops.. Github API limit exceeded. ${err}`));
  }, []);

  return (
    <Wrapper>
      <Header
        title={{ label: 'Lucas Augusto Repositories' }}
        content='A list of my repository'
      />

      <Table headers={header} rows={rows} />
    </Wrapper>
  );
};

export default memo(HomePage);
