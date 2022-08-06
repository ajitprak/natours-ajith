/* eslint-disable */
import axios from 'axios';

import { showAlert } from './alerts';

const baseUrl = 'http://127.0.0.1:8000/';

export const login = async (email, password) => {
    try {
        const res = await axios({
            method: 'POST',
            url: `${baseUrl}api/v1/users/login`,
            data: {
                email,
                password,
            },
        });
        if (res.data.status === 'success') {
            showAlert('success', 'Logged in Successfully !!!');
            setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
    } catch (error) {
        showAlert('error', error.response.data.message); // This is as per the axios doc
    }
};

export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: `${baseUrl}api/v1/users/logout`,
        });
        if (res.data.status === 'success') {
            showAlert('success', 'Logged out successfully !!!');
            location.reload(true); // Here true is given so that it is a server load as opposed to load from browser cache
        }
    } catch (error) {
        showAlert('error', 'Error occured during logout. Please try again !!!');
    }
};
