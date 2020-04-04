import { Intl as i18n } from 'onix-core';
import * as enTranslation from './i18n/en-us.json';
import * as ruTranslation from './i18n/ru-ru.json';

let initialized = false;
export const register = () => {
    if (!initialized) {
        i18n.registerCategories("en-us", enTranslation);
        i18n.registerCategories("ru-ru", ruTranslation);

        initialized = true;
    }
}

register();