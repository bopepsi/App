const getCollectionsByUid = async (req, res, next) => {

}

const createCollection = async (req, res, next) => {

}

const addPostToCollection = async (req, res, next) => {
    const { cid, pid } = req.params;
    res.json({ cid, pid });
}

const removePostFromCollection = async (req, res, next) => {

}

const editCollection = async (req, res, next) => {

}

const deleteCollection = async (req, res, next) => {

}

module.exports = {
    getCollectionsByUid,
    createCollection,
    addPostToCollection,
    removePostFromCollection,
    editCollection,
    deleteCollection
}