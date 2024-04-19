import { Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Header({tokenData, handleLogout}: {tokenData: any, handleLogout: Function}) {

  return (
    <div>
      <nav className='navbar navbar-expand-sm navbar-dark bg-dark'>
        <Container>
          <Link to='/' className='navbar-brand'>
            <span className="navbar-text">EPIC on FHIR Client</span>
          </Link>
          <button
            className='navbar-toggler'
            type='button'
            data-bs-toggle='collapse'
            data-bs-target='#mynavbar'
          >
            <span className='navbar-toggler-icon'></span>
          </button>
          <div className='collapse navbar-collapse' id='mynavbar'>
            <ul className='navbar-nav ms-auto'>
              <li className='nav-item'>
                <Link className='nav-link' to='/'>
                  Patient Profile
                </Link>
              </li>
              <li className='nav-item'>
                <Link className='nav-link' to='/get-medications/'>
                  Medications
                </Link>
              </li>
              <li className='nav-item'>
                <Link className='nav-link' to='/get-lab-results/'>
                  Lab Results
                </Link>
              </li>
              <li className='nav-item'>
                <Link className='nav-link' to='/get-vital-signs/'>
                  Vital Signs
                </Link>
              </li>
              {tokenData && 
                <li>
                  <Button onClick={() => handleLogout()} className='mx-5'>Logout</Button>
                </li>
              }
            </ul>
          </div>
        </Container>
      </nav>
    </div>
  );
}