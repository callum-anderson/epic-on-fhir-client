
class EpicFhirApi {
    parseOperationOutcome(data: any) {
      throw new Error('Method not implemented.');
    }
    baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || 'localhost:8080/fhir';
    }

    async getResources(searchUrl: string): Promise<Response> {

        if (searchUrl.includes('getpages')) return fetch(searchUrl);
        return fetch(`${this.baseUrl}/${searchUrl}`);
    }

    async getResourceById(resourceType: string, id: string, accessToken: string): Promise<Response> {

        return fetch(`${this.baseUrl}/${resourceType}/${id}`, {
            headers: new Headers({
                'Authorization': `Bearer ${accessToken}`, 
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            })
        });

    }

    async postResource(resourceType: any, resource: any): Promise<Response> {

        const name = [{family: resource.familyName, given: [resource.givenName].concat(resource.middleNames.split(' '))}];
        const telecom = [{system: 'phone', value: resource.phoneNumber}];
        const patientResource = {resourceType:'Patient', birthDate: resource.birthDate, name: name, telecom: telecom, gender: resource.gender};

        return fetch(`${this.baseUrl}/${resourceType}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientResource)
        });

    }

    async putResource(resourceType: any, id: string, resource: any): Promise<Response> {

        const name = [{family: resource.familyName, given: [resource.givenName].concat(resource.middleNames.split(' '))}]
        const patientResource = {resourceType:'Patient', id: id, birthDate: resource.birthDate, name: name, gender: resource.gender};

        return fetch(`${this.baseUrl}/${resourceType}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientResource)
        });

    }

    async deleteResource(resourceType: any, id: string): Promise<Response> {

        return fetch(`${this.baseUrl}/${resourceType}/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
        });

    }

}

export default EpicFhirApi;
   
