import React, {useState} from 'react';
import BackgroundImage from '../../assets/live-escape-game-1155620.jpg'
import {Alert, Button, Card, CardContent, Grid, Snackbar, Stack, TextField, Typography} from "@mui/material";
import {common} from "@mui/material/colors";
import { useNavigate } from 'react-router-dom';
import { useGet } from '../../hooks/useGet';
import { getSessionId, setSessionId } from '../../utils/GameSessionHandler';

const StudentJoin = () => {

    const navigate = useNavigate()

    const [roomPin, setRoomPin] = useState('')
    const [snackbar, setSnackbar] = useState(false)

    const {refetch} = useGet(`${import.meta.env.VITE_GAME_BASE_URL}/join/${roomPin}`, false, false)

    const handleUserInput = (e: any) => {
        setRoomPin(e.target.value)
    }

    const sendID = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!getSessionId()) {
            const response = (await refetch());
            const responseData = response.data;

            if (response.isError) {
                setSnackbar(true);
            }
            if (response.isSuccess) {
                console.log("in success")
                const sessionId = getSessionId();
                //@ts-ignore
                switch (responseData.state) {
                    case "PLAYING" :
                        console.log("In Playing")
                        //@ts-ignore
                        setSessionId(responseData.sessionId);
                        //@ts-ignore
                        navigate(`/game-session/${responseData.sessionId}`);
                        break;
                    case "STOPPED":
                        console.log("is Stopped")
                        navigate("/")
                        setSnackbar(true)
                        break
                    case "JOINABLE":
                        console.log("in Joinable")
                        navigate(`/game-lobby/${roomPin}`)
                        //@ts-ignore
                        setSessionId(responseData.sessionId)
                        break
                }
            }
        } else {
            const sessionId = getSessionId()
            navigate(`/game-session/${sessionId}`);
        }

    }

    return (
        <>
            <Grid
                container
                direction="column"
                justifyContent="center"
                alignItems="center"
                height="100vh"
                sx={{
                    backgroundImage: `url(${BackgroundImage})`,
                    backgroundColor: '#404040',
                    backgroundBlendMode: 'multiply',
                    backgroundSize: 'cover',
            }}
            >
                <Typography sx={{paddingBottom: 3}} color={common.white} variant="h2"> Escape Room </Typography>
                <Card sx={{minWidth: 550, paddingX: 3}}>
                    <CardContent>
                        <Stack spacing={2} alignItems="center" component="form" onSubmit={sendID} noValidate>
                            <TextField
                                id="outlined-basic"
                                label="Room-PIN"
                                variant="outlined"
                                value={roomPin}
                                onChange={handleUserInput}
                                fullWidth
                            />
                            <Button sx={{height: 56}} variant="contained" type="submit" fullWidth>JOIN</Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            <Snackbar open={snackbar} autoHideDuration={6000} onClose={() => setSnackbar(false)}>
                <Alert onClose={() => setSnackbar(false)} severity="error" sx={{width: '100%'}}>
                    The given lobby is either closed or doesn't exist
                </Alert>
            </Snackbar>
        </>
    );
};

export default StudentJoin;