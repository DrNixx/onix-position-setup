import toSafeInteger from 'lodash-es/toSafeInteger';
import * as React from 'react';
import { Row, Col, Button, FormGroup, FormControl, FormLabel, FormCheck, Container } from 'react-bootstrap';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { Intl as IntlCore } from 'onix-core';
import { onixPostMessage } from 'onix-io';
import { pushif } from 'onix-core';
import { Color, Castle, Piece, Square, IOpeningPosition } from 'onix-chess';
import { BoardSize, Orientation, ChessBoard, ChessDragLayer } from 'onix-board';
import { SizeSelector, PieceSelector, SquareSelector, WhoMoveSelector, StartPosSelector } from 'onix-chess-ctrls';
import { PositionStore } from './PositionStore';
import { ChessHolder } from './ChessHolder';
import { Intl } from '../Intl';
import { TextWithCopy } from '../TextWithCopy';
import { from } from 'rxjs';
import { Chessground } from 'chessground'
import { Api } from 'chessground/api';

export interface DumbPositionProps {
    store?: PositionStore,
    url: string,
    dialog?: boolean,
    openingsPos: IOpeningPosition[],
    flipBoard: (flag: boolean) => void,
    setCoords: (flag: boolean) => void,
    setFrame: (flag: boolean) => void,
    setMoveTurn: (flag: boolean) => void,
    resize: (size: BoardSize) => void,
    setPieces: (piece: string) => void,
    setSquares: (square: string) => void,
    changeColor: (color) => void,
    changeMoveNo: (move: number) => void,
    changeEp: (sq: number) => void,
    changeFen: (fen: string) => void,
    changeCastle: (flag: boolean, val: string) => void,
    changeStart: (val: string) => void,
}

export interface DumbPositionState {
    ep_target: string,
    markers: string
}

@DragDropContext(HTML5Backend)
export class DumbPosition extends React.Component<DumbPositionProps, DumbPositionState> {

    boardElement: HTMLDivElement;
    cg: Api;

    constructor(props: DumbPositionProps) {
        super(props);

        Intl.register();

        const state = this.props.store.getState();
        this.state = {
            ep_target: this.epName(state.board.position.EpTarget),
            markers: state.board.markers,
        } 
    }

    componentDidMount() {
        this.cg = Chessground(this.boardElement, {});
    }
    
    componentWillReceiveProps(nextProps) {
        // this.cg.set(this.buildConfigFromProps(nextProps))
    }
    
    componentWillUnmount() {
        this.cg.destroy()
    }

    private onEpChange? = (e) => {
        const { changeEp } = this.props;
        const { state } = this;
        if (changeEp) {
            const sq = Square.parse(e.target.value);
            changeEp(sq);
        }

        this.setState({
            ...state,
            ep_target: e.target.value
        });
    }

    private onCastleChange? = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { changeCastle } = this.props;
        if (changeCastle) {
            changeCastle(e.target.checked, e.target.value);
        }
    }

    private onFlipChange? = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { flipBoard } = this.props;
        if (flipBoard) {
            flipBoard(e.target.checked);
        }
    }

    private onCoordsChange? = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { setCoords } = this.props;
        if (setCoords) {
            setCoords(e.target.checked);
        }
    }

    private onFrameChange? = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { setFrame } = this.props;
        if (setFrame) {
            setFrame(e.target.checked);
        }
    }

    private onTurnChange? = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { setMoveTurn } = this.props;
        if (setMoveTurn) {
            setMoveTurn(e.target.checked);
        }
    }

    private hasCastle? = (color: number, side: Castle) => {
        const state = this.props.store.getState();
        return state.board.position.getCastling(color, side);
    }

    private epName? = (ep: number) => {
         return (ep !== Square.NullSquare) ? Square.squareName(ep) : "";
    }

    private changeMoveNo? = (e) => {
        const { changeMoveNo } = this.props;
        if (changeMoveNo) {
            changeMoveNo(toSafeInteger(e.target.value));
        }
    }

    private onStartChange? = (fen) => {
        const { changeStart } = this.props;
        if (changeStart) {
            changeStart(fen);
        }
    }

    private onMarkChange? = (e) => {
        const { state } = this;
        
        this.setState({
            ...state,
            markers: e.target.value
        });
    }

    render() {
        const { store, dialog, openingsPos, flipBoard, setCoords, setFrame, setMoveTurn, resize, setPieces, setSquares, changeColor, changeCastle } = this.props;
        const state = store.getState();
        const { fen, size, piece, square, flip, position, coords, frame, moveturn, selection } = state.board;
        const { markers } = this.state;
        
        const asize = dialog ? 2 : size;
        
        const whoMove = position.WhoMove;

        
    }
}