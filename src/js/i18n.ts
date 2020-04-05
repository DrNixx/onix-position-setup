import { i18n as i18nCore } from 'onix-core';
import * as enTranslation from './i18n/en-us.json';
import * as ruTranslation from './i18n/ru-ru.json';

let initialized = false;
export const register = () => {
    if (!initialized) {
        i18nCore.registerCategories("en-us", enTranslation);
        i18nCore.registerCategories("ru-ru", ruTranslation);

        initialized = true;
    }
}

register();