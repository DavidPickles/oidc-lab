const redactClientSecret = (req) => {
    const deepCopy = JSON.parse(JSON.stringify(req));
    if (deepCopy.data?.client_secret) {
        deepCopy.data.client_secret = "*****"
    }
    return deepCopy
}

function removeOfflineAccess(scopes) {
    let scopeArray = scopes.split(" ");
    let index = scopeArray.indexOf("offline_access");
    if (index > -1) {
        scopeArray.splice(index, 1);
    }
    return scopeArray.join(" ");
}

export default { redactClientSecret, removeOfflineAccess }