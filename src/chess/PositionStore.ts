import { Store, createStore as reduxCreateStore, combineReducers } from 'redux';
import { IntlState, intlReducer } from 'onix-app';
import { boardReducer } from '../BoardReducer';
import { BoardState } from '../BoardState';

export interface PositionState {
    intl: IntlState,
    board: BoardState
}

export type PositionStore = Store<PositionState>;

export const createPositionStore = (preloadedState: PositionState) =>
    reduxCreateStore(
        combineReducers<PositionState>({
            intl: intlReducer,
            board: boardReducer
        }), preloadedState);
