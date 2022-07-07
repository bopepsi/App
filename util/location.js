const API_KEY = process.env.GOOGLE_GEO_API;
const axios = require('axios');
const HttpError = require('../models/http-error');

async function getCoordsForAddress(address) {

    try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`);
        const data = response.data;
        if (!data || data.status === 'ZERO_RESULTS') {
            const error = new HttpError('Could not find location for the address', 422);
            throw error;
        };
        const formalAddress = data.results[0]['formatted_address'];
        const coordinates = data.results[0].geometry.location;
        console.log(formalAddress);
        return { coordinates, formalAddress };
    } catch (error) {
        throw error;
    }
};

async function getAddressForCoords(lat, lng) {
    try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`);
        const data = response.data;
        if (!data || data.status === 'ZERO_RESULTS') {
            const error = new HttpError('Could not find address for the coords', 422);
            throw error;
        };
        const formalAddress = data.results['address_components'];
        const coordinates = data.results[0].geometry.location;
        console.log(formalAddress);
        return { formalAddress, coordinates };
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getCoordsForAddress,
    getAddressForCoords
} 