/* eslint-disable */
import axios from 'axios';

import { showAlert } from './alerts';

// const baseUrl = 'http://127.0.0.1:8000/';

export const bookTour = async (tourId) => {
    try {
        // 1) Get the session
        const session = await axios({
            method: 'POST',
            url: `/api/v1/bookings//checkout-session/${tourId}`,
        });
        // console.log(session);

        // 2) Redirect to stripe
        window.location.href = session.data.session.url;
    } catch (error) {
        console.log(error);
        showAlert('error', error);
    }
};
