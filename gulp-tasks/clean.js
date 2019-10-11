import del from 'del';
import PATHS from '../paths';

export default function clean(cb) {
	del.sync(PATHS.clean, {force: true});
  	cb();
}
