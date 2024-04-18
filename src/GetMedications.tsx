import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "./Loader";
import { Patient, BundleEntry } from 'fhir/r4';
import FhirApi from "./services/EpicFhirApi";
import { Alert, Button, Col, Form, FormGroup, Row } from "react-bootstrap";

const GetMedications = ({fhirApi}: {fhirApi: FhirApi}) => {

  const params: { [key: string]: any } = {};

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [previous, setPrevious] = useState('');
  const [next, setNext] = useState('');
  const [searchParams, setSearchParams] = useState(params);
  const [Patients, setPatients] = useState([]);

  useEffect(() => {
    getPatients('Patient?_count=10');
  }, []);

  const getPatients = (searchUrl: string) => {

    setIsLoading(true);

    fhirApi.getResources(searchUrl)
    .then((res) => {
            return res.json();
        })
        .then(res => {
            const next = res.link?.filter((x: any) => x.relation === 'next').at(0)?.url;
            const previous = res.link?.filter((x: any) => x.relation === 'previous').at(0)?.url;
            setPrevious(previous);
            setNext(next);
            setPatients(res.entry?.map((bundleEntry: BundleEntry) => bundleEntry.resource));
        })
        .catch((err) => {
            console.log(err);
            setError(err instanceof Error ? err.message : 'Unable to GET /Patient');
        })
        .finally(() => setIsLoading(false));

  };

  const handleInput = (event: any) => {
    event.preventDefault();

    const { name, value } = event.target;

    setSearchParams({ ...searchParams, [name]: value });

  }

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    const keyValueStr = Object.keys(searchParams).filter(x => searchParams[x]).map(key => `${key}=${encodeURIComponent(searchParams[key])}`).join("&");

    getPatients(`Patient${keyValueStr ? `?${keyValueStr}` : ''}`);
  }

  if (!Patients) {
    return <h5 className="my-5">No patients found.</h5>;
  } else {
    return (
      <div className="mt-5">
          <Form className="mt-5" onSubmit={handleSubmit}>
            <Form.Group as={Row} className="mb-3" controlId="patientName">
                <Form.Label column sm={4} className="my-3">First Name</Form.Label>
                <Col sm={6} className="my-3">
                    <Form.Control className="col-md-6" type="text" name="given" placeholder="Search first name" onChange={handleInput} />
                </Col>
                <Form.Label column sm={4} className="my-3">Last Name</Form.Label>
                <Col sm={6} className="my-3">
                    <Form.Control type="text" name="family" placeholder="Search last name" onChange={handleInput} />
                </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3" controlId="patientPhoneNumber">
                <Form.Label column sm={4} className="my-3">Phone Number</Form.Label>
                <Col sm={6} className="my-3">
                    <Form.Control className="col-md-6" type="text" name="telecom" placeholder="Search phone number" onChange={handleInput} />
                </Col>
                <Col sm={2} className="my-3">
                  <Button className="btn btn-primary btn-large centerButton" type="submit">Filter</Button>
                </Col>
            </Form.Group>
          </Form>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>First Name(s)</th>
              <th>Family Name</th>
              <th>Gender</th>
              <th>Date of Birth</th>
              <th>Phone Number</th>
            </tr>
          </thead>
          <tbody>
            {Patients.map((patient: Patient, i) => {
              return (
                <tr key={patient.id}>
                  <td>{patient.id}</td>
                  <td>{patient.name?.at(0)?.given?.join(' ')}</td>
                  <td>{patient.name?.at(0)?.family}</td>
                  <td>{patient.gender? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : undefined}</td>
                  <td>{patient.birthDate}</td>
                  <td>{patient.telecom?.filter((x: any) => x.system === 'phone')?.at(0)?.value}</td>
                  <td>
                    <Link to={`/Patient/${patient?.id}`}>
                        <Button className="btn btn-primary btn-large centerButton">Edit</Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {error && 
            <Alert variant="danger" className="p-2 my-5">
              <Alert.Heading>Error</Alert.Heading>
              <p>{error}</p>
            </Alert>}
        {(Patients && Patients.length > 0) &&
        <Row className="justify-content-md-center">
            <Col xs lg="2">
                <Button className="btn btn-primary centerButton w-100" disabled={!previous} onClick={() => getPatients(previous)}>Previous</Button>
            </Col>
            <Col xs lg="2">
                <Button className="btn btn-primary centerButton w-100" disabled={!next} onClick={() => getPatients(next)}>Next</Button>
            </Col>
        </Row>}
        {isLoading && <Loader />}
      </div>
    );
  }
};

export default GetMedications;