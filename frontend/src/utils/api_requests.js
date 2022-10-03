
export async function postBadgeRequest(badge) {
    let response;

    try {
        fetch(`${API_URL}/badges/}`, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            data: badge
        })
        .then(res => res.json())
        .then(data => {
            console.log('got org response', data);
            if (!data?.id) throw new Error("Org POST request failed, id not found");
            response = data;
        })
        .catch(err => {
            console.log('error creating org', err);
            response.error = err;
        })
    }
    catch (err) {
        console.log('error creating org', err);
        response.error = err;
    }

    return response;
}

export async function postOrgRequest(org) {
    let response;

    try {
        fetch(`${API_URL}/organizations/`, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            data: org
        })
        .then(res => res.json())
        .then(data => {
            console.log('got org response', data);
            if (!data?.id) throw new Error("Org POST request failed, id not found");
            response = data;
        })
        .catch(err => {
            console.log('error creating org', err);
            response.error = err;
        })
    }
    catch (err) {
        console.log('error creating org', err);
        response.error = err;
    }

    return response;
}

export async function getUserRequest(address) {
    let response;
    try {
        fetch(`${API_URL}/users/by-address/${address}`, {
            method: "GET",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then(res => res.json())
        .then(data => {
            if (data.length < 1) throw new Error("No user data found");
            console.log('got user data', data);
            response = data;
        })
        .catch(err => {
            console.log('error fetching user data', err);
            response = {error: err}
        })
    }
    catch (err) {
        console.log('error fetching user data', err);
        response = {error: err}
    }

    return response;
}

export async function getOrgRequest(orgId) {
    let response;
    try {
        fetch(`${API_URL}/users/by-address/${address}`, {
            method: "GET",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
        })
        .then(res => res.json())
        .then(data => {
            if (data.length < 1) throw new Error("No org data found");
            console.log('got user data', data);
            response = data;
        })
        .catch(err => {
            console.log('error fetching user data', err);
            response = {error: err}
        })
    }
    catch (err) {
        console.log('error fetching user data', err);
        response = {error: err}
    }

    return response
}
