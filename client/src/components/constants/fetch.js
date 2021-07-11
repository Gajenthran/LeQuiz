export const fetchWrapper = {
  get,
  post,
  put,
  delete: _delete
};

const STATUS_CODE = {
  "ok": 200,
  "notModified": 304,
  "invalidInputData": 400,
  "invalidToken": 401,
  "notFound": 404
}

async function get(url, auth = false) {
  const headers = new Headers();

  const requestOptions = {
    method: 'GET',
    headers
  }

  return fetch(url, requestOptions).then(handleResponse);
}

async function post(url, body, auth = null) {
  const headers = new Headers();

  headers.append('Content-Type', 'application/json');
  headers.append('Accept', 'application/json');

  const requestOptions = {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  };
  return fetch(url, requestOptions).then(handleResponse);
}

async function put(url, body, auth = null) {
  const headers = new Headers();

  headers.append('Content-Type', 'application/json');
  headers.append('Accept', 'application/json');

  const requestOptions = {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  };
  return fetch(url, requestOptions).then(handleResponse);
}

// prefixed with underscored because delete is a reserved word in javascript
async function _delete(url, auth = false) {
  const headers = new Headers();

  const requestOptions = {
    method: 'DELETE',
    headers
  };
  return fetch(url, requestOptions).then(handleResponse);
}

// TODO: interface of response
function handleResponse(response) {
  return response.text().then((text) => {
    const { status, body, message } = text && JSON.parse(text);

    if (status !== STATUS_CODE.ok) {
      const error = message
      return Promise.reject(error);
    }

    return body;
  });
}