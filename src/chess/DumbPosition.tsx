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

        let params = [];

        pushif(params, (size !== 2), ["size", size]);
        pushif(params, flip, ["fb", 1]);
        pushif(params, moveturn, ["who", 1]);
		pushif(params, !coords, ["hl", 1]);
        pushif(params, (piece !== 'merida'), ["pset", encodeURIComponent(piece)]);
        pushif(params, (square !== 'color-blue'), ["sset", encodeURIComponent(square)]);
        pushif(params, !!markers, ["mv", markers])

		const makeLink = () => {
            let img = this.props.url || "https://www.chess-online.com/fen.png"
            img += "?fen=" + encodeURIComponent(fen);

            if (params.length > 0) {
                img += "&" + params.map(function(val){
                    return val.join("=");
                }).join("&")
            }
            
            return img;
        }

        const makeCode = () => {
            let el = document.createElement("div");
            el.innerHTML = encodeURIComponent(fen);            
            
            params.forEach(element => {
                el.setAttribute(element[0], element[1]);
            });
            
            return el.outerHTML.replace(/div/g, "gc:fen");
        }

        const renderDialogButton = () => {
            const executeDialog = () => {
                if (window.parent) {
                    var parent_url = decodeURIComponent(document.location.hash.replace(/^#/, ''));
                    var text = makeCode();
                    onixPostMessage(text, parent_url, parent);
                }
            };

            return (dialog) ? (
                <Row>
                    <Col md={12}><Button block={true} variant="primary" onClick={executeDialog}>{IntlCore.t("builder", "paste_forum_code")}</Button></Col>
                </Row>
            ) : null;
        }

        return (
            <Container className="pos-builder blue">
                <Row>
                    <Col md={12}>
                        <div className="d-block d-lg-flex">
                            <div className="board-container merida">
                                <div className="holder-container">
                                    <ChessHolder 
                                        store={this.props.store}
                                        orient={Orientation.Horizontal} />
                                </div>
                                <div className="main-board" ref={el => this.boardElement = el} />
                                {renderDialogButton()}
                            </div>
                            <div className="controls flex-grow-1">
                                <div className="code-row">
                                    <Row>
                                        <Col md={12}>
                                            <FormGroup controlId="fen">
                                                <FormLabel>{IntlCore.t("chess", "fen")}</FormLabel>
                                                <TextWithCopy value={fen} size="sm" placeholder={IntlCore.t("chess", "fen")} />
                                            </FormGroup>    
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12}>
                                            <FormGroup controlId="image_link">
                                                <FormLabel>{IntlCore.t("builder", "image_link")}</FormLabel>
                                                <TextWithCopy value={makeLink()} size="sm" placeholder={IntlCore.t("builder", "image_link")} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12}>
                                            <FormGroup controlId="forum_code">
                                                <FormLabel>{IntlCore.t("builder", "forum_code")}</FormLabel>
                                                <TextWithCopy value={makeCode()} size="sm" placeholder={IntlCore.t("builder", "forum_code")} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-sets">
                                    <Row>
                                        <Col md={4}>
                                        <FormGroup controlId="size">
                                                <FormLabel>{IntlCore.t("chess", "size")}</FormLabel>
                                                <SizeSelector defaultSize={size} onChangeSize={resize} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup controlId="piece">
                                                <FormLabel>{IntlCore.t("chess", "pieces")}</FormLabel>
                                                <PieceSelector defaultPiece={piece} onChangePiece={setPieces} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup controlId="square">
                                                <FormLabel>{IntlCore.t("chess", "squares")}</FormLabel>
                                                <SquareSelector defaultSquare={square} onChangeSquare={setSquares} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-start">
                                    <Row>
                                        <Col md={8} sm={12}>
                                            <FormGroup controlId="startpos">
                                                <FormLabel srOnly={true}>{IntlCore.t("chess-ctrls", "position_label")}</FormLabel>
                                                <StartPosSelector fen={fen} openingsPos={openingsPos} onChange={this.onStartChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4} sm={12}>
                                            <FormGroup controlId="who_move">
                                                <FormLabel srOnly={true}>{IntlCore.t("chess", "who_move")}</FormLabel>
                                                <WhoMoveSelector defaultTurn={whoMove} onChangeTurn={changeColor} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-params">
                                    <div><strong>{IntlCore.t("builder", "pos_param")}</strong></div>
                                    <Row>
                                        <Col md={3} sm={6}>
                                            <FormGroup controlId="moveNo">
                                                <FormLabel>{IntlCore.t("chess", "move_no")}</FormLabel>
                                                <FormControl 
                                                    size="sm" 
                                                    value={position.getMoveNo().toString()} 
                                                    onChange={this.changeMoveNo} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormGroup controlId="epTarget">
                                                <FormLabel>{IntlCore.t("chess", "ep_target")}</FormLabel>
                                                <FormControl 
                                                    size="sm"
                                                    value={this.state.ep_target} 
                                                    title={IntlCore.t("builder", "ep_target_hint")} 
                                                    onChange={this.onEpChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup controlId="marks">
                                                <FormLabel>{IntlCore.t("builder", "marks")}</FormLabel>
                                                <FormControl 
                                                    size="sm"
                                                    value={this.state.markers} 
                                                    title={IntlCore.t("builder", "marks_hint")}
                                                    onChange={this.onMarkChange} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-castle">
                                    <div><strong>{IntlCore.t("chess", "castle")}</strong></div>
                                    <Row>
                                        <Col md={6}>
                                            <div className="color-group">
                                                <label>{IntlCore.t("chess", "white")}</label>
                                                <Row>
                                                    <Col xs={5}>
                                                        <FormCheck 
                                                            id ="wck"
                                                            type="checkbox"
                                                            value={Piece.WKing.toString()}
                                                            onChange={this.onCastleChange}
                                                            defaultChecked={this.hasCastle(Color.White, Castle.KSide)}
                                                            label={Castle.K} />
                                                    </Col>
                                                    <Col xs={7}>
                                                        <FormCheck 
                                                            id ="wcq"
                                                            type="checkbox"
                                                            value={Piece.WQueen.toString()} 
                                                            onChange={this.onCastleChange} 
                                                            defaultChecked={this.hasCastle(Color.White, Castle.QSide)}
                                                            label={Castle.Q} />
                                                    </Col>
                                                </Row>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="color-group">
                                                <label>{IntlCore.t("chess", "black")}</label>
                                                <Row>
                                                    <Col xs={5}>
                                                        <FormCheck 
                                                            id ="bck"
                                                            type="checkbox"
                                                            value={Piece.BKing.toString()} 
                                                            onChange={this.onCastleChange} 
                                                            defaultChecked={this.hasCastle(Color.Black, Castle.KSide)}
                                                            label={Castle.K} />
                                                    </Col>
                                                    <Col xs={7}>
                                                        <FormCheck 
                                                            id ="bcq"
                                                            type="checkbox"
                                                            value={Piece.BQueen.toString()} 
                                                            onChange={this.onCastleChange} 
                                                            defaultChecked={this.hasCastle(Color.Black, Castle.QSide)}
                                                            label={Castle.Q} />
                                                    </Col>
                                                </Row>
                                            </div>
                                        </Col>
                                    </Row>                                
                                </div>
                                <div className="pos-display">
                                    <Row>
                                        <Col md={3} sm={6}>
                                            <FormCheck 
                                                id ="flip" 
                                                type="checkbox"
                                                value="1" 
                                                onChange={this.onFlipChange} 
                                                defaultChecked={flip}
                                                label={IntlCore.t("builder", "display_flip")} />
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormCheck 
                                                id ="coords" 
                                                type="checkbox"
                                                value="1" 
                                                onChange={this.onCoordsChange} 
                                                defaultChecked={coords}
                                                label={IntlCore.t("builder", "display_coord")} />
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormCheck 
                                                id ="frame" 
                                                type="checkbox"
                                                value="1" 
                                                onChange={this.onFrameChange} 
                                                defaultChecked={frame}
                                                label={IntlCore.t("builder", "display_frame")} />
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormCheck 
                                                id ="turn" 
                                                type="checkbox"
                                                value="1" 
                                                onChange={this.onTurnChange} 
                                                defaultChecked={moveturn}
                                                label={IntlCore.t("builder", "display_moveturn")} />
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                            <ChessDragLayer size={size} />
                        </div>
                    </Col>
                </Row>
            </Container>
        );
    }
}