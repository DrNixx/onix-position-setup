import * as React from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { Intl as IntlCore } from 'onix-core';
import { onixPostMessage } from 'onix-io';
import { intVal, pushif } from 'onix-core';
import { Color, Castle, Piece, Square, IOpeningPosition } from 'onix-chess';
import { BoardMode, BoardSize, Orientation, ChessBoard, ChessDragLayer } from 'onix-board';
import { Row, Col, Button, FormGroup, FormControl, ControlLabel, Checkbox, TextWithCopy } from 'onix-ui';
import { SizeSelector, PieceSelector, SquareSelector, WhoMoveSelector, StartPosSelector } from 'onix-chess-ctrls';
import { PositionStore } from './PositionStore';
import { ChessHolder } from './ChessHolder';
import { Intl } from '../Intl';

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
    constructor(props: DumbPositionProps) {
        super(props);

        Intl.register();

        const state = this.props.store.getState();
        this.state = {
            ep_target: this.epName(state.board.position.EpTarget),
            markers: state.board.markers,
        } 
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
            changeMoveNo(intVal(e.target.value));
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
                    <Col md={12}><Button block={true} state="primary" onClick={executeDialog}>{IntlCore.t("builder", "paste_forum_code")}</Button></Col>
                </Row>
            ) : null;
        }

        return (
            <div className="pos-builder">
                <Row>
                    <Col md={12}>
                        <div className="board-container">
                            <div className="holder-container">
                                <ChessHolder 
                                    store={this.props.store}
                                    orient={Orientation.Horizontal} />
                            </div>
                            <ChessBoard
                                store={this.props.store}
                                dnd={true}
                                legal={false}
                                getPiece={position.getPiece}
                            />
                            {renderDialogButton()}
                        </div>
                        <div className="controls">
                            <div className="code-row">
                                <Row>
                                    <Col md={12}>
                                        <FormGroup controlId="fen">
                                            <ControlLabel>{IntlCore.t("chess", "fen")}</ControlLabel>
                                            <TextWithCopy value={fen} scale="small" placeholder={IntlCore.t("chess", "fen")} />
                                        </FormGroup>    
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <FormGroup controlId="image_link">
                                            <ControlLabel>{IntlCore.t("builder", "image_link")}</ControlLabel>
                                            <TextWithCopy value={makeLink()} scale="small" placeholder={IntlCore.t("builder", "image_link")} />
                                        </FormGroup>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <FormGroup controlId="forum_code">
                                            <ControlLabel>{IntlCore.t("builder", "forum_code")}</ControlLabel>
                                            <TextWithCopy value={makeCode()} scale="small" placeholder={IntlCore.t("builder", "forum_code")} />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </div>

                            <div className="pos-sets">
                                <Row>
                                    <Col md={4}>
                                    <FormGroup controlId="size">
                                            <ControlLabel>{IntlCore.t("chess", "size")}</ControlLabel>
                                            <SizeSelector defaultSize={size} onChangeSize={resize} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup controlId="piece">
                                            <ControlLabel>{IntlCore.t("chess", "pieces")}</ControlLabel>
                                            <PieceSelector defaultPiece={piece} onChangePiece={setPieces} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup controlId="square">
                                            <ControlLabel>{IntlCore.t("chess", "squares")}</ControlLabel>
                                            <SquareSelector defaultSquare={square} onChangeSquare={setSquares} />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </div>

                            <div className="pos-start">
                                <Row>
                                    <Col md={8} sm={12}>
                                        <FormGroup controlId="startpos">
                                            <ControlLabel srOnly={true}>{IntlCore.t("chess-ctrls", "position_label")}</ControlLabel>
                                            <StartPosSelector fen={fen} openingsPos={openingsPos} onChange={this.onStartChange} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4} sm={12}>
                                        <FormGroup controlId="who_move">
                                            <ControlLabel srOnly={true}>{IntlCore.t("chess", "who_move")}</ControlLabel>
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
                                            <ControlLabel>{IntlCore.t("chess", "move_no")}</ControlLabel>
                                            <FormControl scale="small" value={position.getMoveNo()} onChange={this.changeMoveNo} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={3} sm={6}>
                                        <FormGroup controlId="epTarget">
                                            <ControlLabel>{IntlCore.t("chess", "ep_target")}</ControlLabel>
                                            <FormControl 
                                                scale="small"
                                                value={this.state.ep_target} 
                                                title={IntlCore.t("builder", "ep_target_hint")} 
                                                onChange={this.onEpChange} />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup controlId="marks">
                                            <ControlLabel>{IntlCore.t("builder", "marks")}</ControlLabel>
                                            <FormControl 
                                                scale="small"
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
                                                    <Checkbox 
                                                        id ="wck"
                                                        value={Piece.WKing.toString()} 
                                                        onChangeState={changeCastle} 
                                                        checked={this.hasCastle(Color.White, Castle.KSide)}>{Castle.K}</Checkbox>
                                                </Col>
                                                <Col xs={7}>
                                                    <Checkbox 
                                                        id ="wcq"
                                                        value={Piece.WQueen.toString()} 
                                                        onChangeState={changeCastle} 
                                                        checked={this.hasCastle(Color.White, Castle.QSide)}>{Castle.Q}</Checkbox>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Col>
                                    <Col md={6}>
                                        <div className="color-group">
                                            <label>{IntlCore.t("chess", "black")}</label>
                                            <Row>
                                                <Col xs={5}>
                                                    <Checkbox 
                                                        id ="bck"
                                                        value={Piece.BKing.toString()} 
                                                        onChangeState={changeCastle} 
                                                        checked={this.hasCastle(Color.Black, Castle.KSide)}>{Castle.K}</Checkbox>
                                                </Col>
                                                <Col xs={7}>
                                                    <Checkbox 
                                                        id ="bcq"
                                                        value={Piece.BQueen.toString()} 
                                                        onChangeState={changeCastle} 
                                                        checked={this.hasCastle(Color.Black, Castle.QSide)}>{Castle.Q}</Checkbox>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Col>
                                </Row>                                
                            </div>
                            <div className="pos-display">
                                <Row>
                                    <Col md={3} sm={6}>
                                        <Checkbox 
                                            id ="flip" 
                                            value="1" 
                                            onChangeState={flipBoard} 
                                            checked={flip}>{IntlCore.t("builder", "display_flip")}</Checkbox>
                                    </Col>
                                    <Col md={3} sm={6}>
                                        <Checkbox 
                                            id ="coords" 
                                            value="1" 
                                            onChangeState={setCoords} 
                                            checked={coords}>{IntlCore.t("builder", "display_coord")}</Checkbox>
                                    </Col>
                                    <Col md={3} sm={6}>
                                        <Checkbox 
                                            id ="frame" 
                                            value="1" 
                                            onChangeState={setFrame} 
                                            checked={frame}>{IntlCore.t("builder", "display_frame")}</Checkbox>
                                    </Col>
                                    <Col md={3} sm={6}>
                                        <Checkbox 
                                            id ="turn" 
                                            value="1" 
                                            onChangeState={setMoveTurn} 
                                            checked={moveturn}>{IntlCore.t("builder", "display_moveturn")}</Checkbox>
                                    </Col>
                                </Row>
                            </div>
                        </div>
                        <ChessDragLayer size={size} />
                    </Col>
                </Row>
            </div>
        );
    }
}