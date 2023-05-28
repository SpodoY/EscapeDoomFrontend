import React, {useEffect, useRef, useState} from 'react';
import Editor from '@monaco-editor/react';
import {Box, Button, FormControl, MenuItem, Select, SelectChangeEvent, Stack, Typography, createTheme} from "@mui/material";
import Node from './Nodes/Node';
import { getSessionId } from '../../utils/GameSessionHandler';
import { useGet } from '../../hooks/useGet';
import { PlayArrow } from '@mui/icons-material';
import EditorContainer from './EditorContainer';
import { submitCode } from '../../hooks/submitCode';
import { getCode } from '../../hooks/getCode';
import LoadingButton from '@mui/lab/LoadingButton';
import type {} from '@mui/lab/themeAugmentation';
import { Link, useNavigate } from 'react-router-dom';
import { green } from '@mui/material/colors';

enum compileStatus {
    ERROR = "ERROR",
    COMPILED = "COMPILED",
    SUCCESS = "SUCCESS",
    WAITING = "WAITING",
    WON = "WON",
    BADREQUEST = "BADREQUEST"
}

const EscapeView = () => {

    const navigate = useNavigate()
    const waiting : string = "WAITING"
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const [code, setCode] = useState(`private static int solve() {
    return 35 + 7; 
}
    `)

    const [language, setLangauge] = useState('java')
    const sessionID = getSessionId()
    const [sceneInfo, setSceneInfo] = useState(Object)
    const [codeExecResponse, setCodeExecResponse] = useState({
        "status" : "",
        "output" : ""
    })

    const [submitCodeBody, setSubmitCodeBody] = useState({
        "playerSessionId": sessionID,
        "language": "Java",
        "code": code,
        "codeRiddleID": 1,
        "dateTima": null
    })

    const getStage = useGet(`${import.meta.env.VITE_GAME_BASE_URL}/join/getStage/${sessionID}`)
    const submitCodeCall = submitCode(`${import.meta.env.VITE_GAME_BASE_URL}/join/submitCode`, submitCodeBody)
    //@ts-ignore
    const getCodeCall = getCode(`${import.meta.env.VITE_GAME_BASE_URL}/join/getCode/${sessionID}`)

    const handleCodeSubmission = async () => {
        await submitCodeCall.refetch()
        let respo = await getCodeCall.refetch()
        while(respo.data.status === waiting) {
            await sleep(500)
            respo = await getCodeCall.refetch()
        }

        switch (respo.data.status) {
            case compileStatus.SUCCESS: {
                //TODO: Make Node for reload visible ;)
                // window.location.reload()
                break
            }
            case compileStatus.WON: {
                navigate('/leaderboard')
                break
            }
        }
        console.log(respo.data)
        setCodeExecResponse(respo.data)
    }

    const handleChange = (event: SelectChangeEvent) => {
        setLangauge(event.target.value as string)
    }

    const handleEditorChange = (value: any) => {
        setCode(value)
        setSubmitCodeBody({
            "playerSessionId": sessionID,
            "language": language.charAt(0).toUpperCase() + language.slice(1),
            "code": value,
            //@ts-ignore
            "codeRiddleID":  sceneInfo.codeRiddleID,
            "dateTima": null
        })
    }

    useEffect(() => {
        if (!getStage.isFetching && !getStage.isError) {
            console.log(getStage.data)
            try {
                //@ts-ignore
                switch (getStage.data.state) {
                    case "PLAYING":
                        //@ts-ignore
                        setSceneInfo(JSON.parse(getStage.data.stage[0])[0])
                        break
                    case "STOPPED":
                        //TODO INFORM USER OF SESSION NOT avalibe
                        navigate("/")
                }
            } catch (e) {
                window.location.reload()
            }
        }
    }, [getStage.data])

    useEffect(() => {
        if (Object.keys(sceneInfo).length !== 0) console.log(sceneInfo)
    }, [sceneInfo])

    const editorRef = useRef(null)

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor
    }

    return (
        <Stack direction="row" alignItems="center" height="100vh">
            <Stack direction="column" height="100vh" maxWidth={"31.5vw"}>
                <EditorContainer>
                    <Stack direction="row" alignItems="center">
                        <Typography mx={2}> Code </Typography>
                        <FormControl variant="standard" size='small'>
                            <Select
                                labelId='languageSelect'
                                value={language}
                                label="Language"
                                onChange={handleChange}
                            > 
                                <MenuItem value="javascript" > Javascript </MenuItem>
                                <MenuItem value="java"> Java </MenuItem>
                                <MenuItem value="python"> Python </MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </EditorContainer>
                <EditorContainer sx={{flexGrow: 1, flexShrink: 1}}>
                    <Editor
                        height="100%"
                        width="30vw"
                        language={language}
                        //@ts-ignore
                        value={code}
                        onMount={handleEditorDidMount}
                        onChange={handleEditorChange}
                        theme={"vs-dark"}
                        options={{
                            wordWrap: 'on',
                            minimap: { enabled: false },
                            folding: false,
                            lineNumbersMinChars: 3,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />
                </EditorContainer>
                <EditorContainer>
                    <Stack direction="column">
                        <Typography position={{sx: 'relative', lg: 'absolute'}}> Actions </Typography>
                        <LoadingButton
                            sx={{
                                height: 60, 
                                width: 250, 
                                m: 1,
                                alignSelf: 'center'
                            }}
                            startIcon={<PlayArrow/>} 
                            variant='contained' 
                            loading={getCodeCall.data?.status === waiting}
                            loadingPosition="start"
                            onClick={handleCodeSubmission}
                        >
                            <span> Execute </span> 
                        </LoadingButton>
                    </Stack>
                </EditorContainer>
                <EditorContainer sx={{marginBottom: 1, height: "112px", maxHeight: "112px", overflow: "auto"}}>
                    <Stack direction="column">
                        { codeExecResponse.status === compileStatus.SUCCESS ?
                            <Box sx={{backgroundColor: green[300]}} p={1}>
                                <Typography color={green[900]}> Success! </Typography>
                                <Typography color={green[900]}> You solved this riddle, continue to the next one ? </Typography>
                                <Button sx={{color: green[900], fontWeight: 'bold'}} onClick={() => window.location.reload()}> Take me there </Button>
                            </Box>
                            :
                            <></>
                        }
                        <Box>
                            <Typography> Console Output </Typography>
                        </Box>
                        <Box overflow={"auto"}>
                            <Typography fontSize={"0.9rem"} fontWeight={"bold"} color={codeExecResponse.status === compileStatus.ERROR ? '#f00' : '#fff'}> 
                                {
                                    codeExecResponse.status === compileStatus.ERROR ? 'Error Msg' : 'Output'
                                } 
                            </Typography>
                            <Typography> {'> '}{codeExecResponse.output} </Typography>
                        </Box>
                    </Stack>
                </EditorContainer>
            </Stack>

            <Box
                sx={{
                    backgroundImage: `url(${sceneInfo.bgImg})`,
                    backgroundSize: "contain",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                }}
                width={"100%"}
                height={"100%"}
            >
                {
                    sceneInfo.nodes ? (sceneInfo.nodes.map((node: NodeInterface, index: number) => ( 
                        <Node key={index} pos={node.pos} nodeInfos={node.nodeInfos} type={node.type as NodeType} codeSetter={setCode} />
                    ))) : <></>
                }
            </Box>
        </Stack>
    )
};

export default EscapeView;