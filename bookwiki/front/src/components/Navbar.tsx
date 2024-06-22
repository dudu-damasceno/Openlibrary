// components/Navbar.tsx
import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

const Navbar: React.FC = () => {
  return (
    <Drawer
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: '#37057B',
          color: '#fff',
          borderRadius: '0 20px 20px 0', // Borda redonda
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <img src="./" alt="Logo" style={{ width: '80%', marginBottom: '20px' }} />
      </div>
      <List>
        <ListItem button>
          <ListItemText primary="Busca" />
        </ListItem>
        <ListItem button>
          <ListItemText primary="Sobre" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Navbar;