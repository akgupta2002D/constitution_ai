;<Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
  <AppBar position='static' sx={{ bgcolor: 'black' }}>
    <Toolbar>
      <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
        Headstarter Chat
      </Typography>
    </Toolbar>
  </AppBar>
  <Box
    sx={{
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f5f5f5',
      p: 2
    }}
  >
    <Stack
      direction='column'
      spacing={2}
      sx={{
        flexGrow: 1,
        overflow: 'auto',
        maxHeight: 'calc(100vh - 64px - 80px)' // Subtracting AppBar and input field heights
      }}
    >
      {messages.map((message, index) => (
        <Box
          key={index}
          display='flex'
          justifyContent={
            message.role === 'assistant' ? 'flex-start' : 'flex-end'
          }
        >
          <Box
            bgcolor={
              message.role === 'assistant' ? 'primary.main' : 'secondary.main'
            }
            color='white'
            borderRadius={2}
            p={2}
            maxWidth='70%'
          >
            <Typography>{message.content}</Typography>
          </Box>
        </Box>
      ))}
    </Stack>
    <Stack direction='row' spacing={2} sx={{ mt: 2 }}>
      <TextField
        label='Message'
        fullWidth
        value={message}
        onChange={e => setMessage(e.target.value)}
        variant='outlined'
      />
      <Button variant='contained' onClick={sendMessage}>
        Send
      </Button>
    </Stack>
  </Box>
</Box>
