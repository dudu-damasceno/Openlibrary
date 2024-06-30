import React from 'react';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';

const Navbar: React.FC = () => {
  return (
    <Drawer
      sx={{
        width: 180, // Reduzindo a largura do Drawer
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 180, // Ajustando a largura do papel dentro do Drawer
          boxSizing: 'border-box',
          backgroundColor: '#592202',
          color: '#fff',
          borderRadius: '0 20px 20px 0', // Borda redonda
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <img src="./Bookwiki.png" alt="Logo" style={{ width: '80%', marginBottom: '20px' }} /> {/* Ajustando o tamanho da imagem */}
      </div>
    </Drawer>
  );
};

export default Navbar;
