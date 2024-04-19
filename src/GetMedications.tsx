import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "./Loader";
import { BundleEntry, MedicationRequest } from 'fhir/r4';
import { TokenData } from "./CommonTypes";
import EpicFhirApi from "./services/EpicFhirApi";

const GetMedications = ({epicFhirApi, setError}: {epicFhirApi: EpicFhirApi, setError: Function}) => {

  const navigate = useNavigate();

    const [ tokenData, setTokenData ] = useState<TokenData | null>();
    // const [ error, setError] = useState('');
    const [ isLoading, setIsLoading ] = useState(false);
    const [ medications, setMedications ] = useState<MedicationRequest[]>();

    useEffect(() => {
        let tokenDataString = localStorage.getItem('tokenData');
        if (!tokenDataString) navigate("/");
        tokenDataString = JSON.parse(tokenDataString as string);
        setTokenData(JSON.parse(tokenDataString as string)); // double JSON parse needed as tokenData wrapped in ""
    }, []);

    if (tokenData && !medications && !isLoading) {

        setIsLoading(true);
        const queryParams = new URLSearchParams({
          subject: tokenData.patient
        });
        epicFhirApi.searchResourceWithQueryParams('MedicationRequest', queryParams, tokenData.access_token)
            .then((res) => {
                if (res.status === 401) throw Error('Error logging in to EPIC: ' + res.statusText);
                return res.json();
            })
            .then((res) => {
                setMedications(res.entry?.filter(
                  (x: any) => x.resource.resourceType === 'MedicationRequest'
                  ).map((bundleEntry: BundleEntry) => bundleEntry.resource));
            }).catch(err => {
                console.log(err);
                setError('Error logging in to EPIC.')
                window.localStorage.removeItem('tokenData');
                setTokenData(null);
            }).finally(() => setIsLoading(false));
    }

return (
    <div>
        { medications && 
        <div>
            <div className='heading'>
              <h4 className="my-5">Medications</h4>
            </div>
            <table className="table">
                <thead>
                    <tr>
                    <th>ID</th>
                    <th>Description</th>
                    <th>Dosage</th>
                    <th>Reason</th>
                    <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                  {medications.map((medication: MedicationRequest, i) => {
                    return (
                      <tr key={medication.id}>
                        <td>{medication.identifier?.at(0)?.value}</td>
                        <td>{medication.medicationReference?.display}</td>
                        <td>{medication.dosageInstruction?.at(0)?.patientInstruction}</td>
                        <td>{medication.reasonCode?.at(0)?.text}</td>
                        <td>{medication.authoredOn ? new Date(medication.authoredOn).toLocaleDateString() : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
            </table>
        </div>
        }
        {isLoading && <Loader />}
    </div>
)
};

export default GetMedications;