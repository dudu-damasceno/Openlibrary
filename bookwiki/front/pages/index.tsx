// frontend/pages/index.tsx
import React, { useState } from 'react';
import Navbar from '../src/components/Navbar';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import SelectVariants from '../src/components/SelectVariants';

const Home: React.FC = () => {
  const [tableName, setTableName] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);

  return (
    <div style={{ display: 'flex', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <Navbar />
      <Container sx={{ color: '#000', paddingTop: '40px' }}>
        <Typography variant="body1" paragraph>
          This is a simple example of a Next.js site with Material-UI.
        </Typography>

        <SelectVariants setTableName={setTableName} setTableData={setTableData} />
        
        <Typography variant="h6" gutterBottom>
          Tabela Selecionada: {tableName}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Dados da Tabela:
        </Typography>
        <ul>
          {tableData.map((row, index) => (
            <li key={index}>{JSON.stringify(row)}</li>
          ))}
        </ul>
      </Container>
    </div>
  );
};

export default Home;
