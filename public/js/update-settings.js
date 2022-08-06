import axios from 'axios';

import { showAlert } from './alerts';

/* eslint-disable */
const baseUrl = 'http://127.0.0.1:8000/';

// type is either passord or data
export const updateSettings = async (data, type) => {
    try {
        const url = type === 'password' ? `${baseUrl}api/v1/users/change-password` : `${baseUrl}api/v1/users/update-me`;
        const res = await axios({
            method: 'PATCH',
            url,
            data,
        });
        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} Updated Successfully. Reloading ...`);
            setTimeout(() => {
                location.reload();
            }, 1500);
        }
    } catch (error) {
        showAlert('error', error.response.data.message); // This is as per the axios doc
    }
};
