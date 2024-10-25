import { Button } from "react-bootstrap"
import { BsArrowLeft } from "react-icons/bs"
import styled from "styled-components"

interface SettingsScreenProps {
    backCallback: () => void
}
export default function SettingsScreen({backCallback}: SettingsScreenProps) {
    return (
        <SettingsScreenContainer>
            <Button variant="outline-light" onClick={() => backCallback()}><BsArrowLeft/></Button>
            <h1>Settings</h1>
        </SettingsScreenContainer>
    )
}

const SettingsScreenContainer = styled.div`
  text-align: center;
  position: absolute;
  width: 600px;
  top: 20%;
  left: 50%;
  transform: translate(-50%);
`
