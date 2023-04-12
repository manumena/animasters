import { Button } from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import { HiOutlinePlus } from 'react-icons/hi'

export default function PlayersNamesForm() {
  return (
    <>
      <div>
        <Form className='players-form'>
          <Form.Control type="text" placeholder="Player name..." />
          <Form.Control type="text" placeholder="Player name..." />
          <Button variant="outline-light" className='plus-button'><HiOutlinePlus/></Button>
        </Form>
      </div>
      <Button variant="outline-light">Start</Button>
    </>
  )
}
