import { AxiosError } from 'axios';
import { QVueGlobals } from 'quasar';

export const handleAxiosError = ($q: QVueGlobals, error: AxiosError) => {
  if (error.hasOwnProperty('response') && error.response) {
    if (typeof error.response.data === 'object' && error.response.data !== null && 'message' in error.response.data) {
      if (Array.isArray((error.response.data as { message: string[] }).message)) {
        const messages = (error.response.data as { message: string[] }).message;
        const errorMessage = messages.join(', ');
        showErrorDialog($q, errorMessage);
      } else {
        showErrorDialog($q, (error.response.data as { message: string }).message);
      }
    }
  }
}

export const showErrorDialog = ($q: QVueGlobals, message: string) => {
  $q.dialog({
    title: 'Error',
    message: message,
    persistent: true,
  });
}
