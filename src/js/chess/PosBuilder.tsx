import * as React from 'react';
import * as ReactDOM from 'react-dom';
import toSafeInteger from 'lodash/toSafeInteger';
import classNames from 'classnames';
import { Row, Col, Button, FormGroup, FormControl, FormLabel, FormCheck, Container, Card } from 'react-bootstrap';
import { pushif } from 'onix-core';
import { postMessage } from 'onix-io-postmessage';
import { Colors, Squares, Piece, Position, FenString, FenFormat, Color, Castling, CastlingStr, CastlingSide, Square, IChessOpening, Chess } from 'onix-chess';
import { SizeSelector, PieceSelector, SquareSelector, StartPosSelector, WhoMoveSelector, TextWithCopy } from 'onix-chess-ctrls';

import { _ } from 'onix-core';
import { i18nRegister as i18nRegisterChess } from 'onix-chess';
import { register } from '../i18n';

import * as cg from 'chessground/types';
import { Chessground } from 'chessground';
import { Api } from 'chessground/api';
import { Config } from 'chessground/config';
import { dragNewPiece } from 'chessground/drag';
import { DrawShape } from 'chessground/draw';
import { eventPosition, isRightButton as isRightButtonEvent } from 'chessground/util';

import { BoardSize, BoardSizeClass } from 'onix-board-assets';

type Selected = "pointer" | "trash" | [cg.Color, cg.Role];

// can be 'pointer', 'trash', or [color, role]
function joinSelected(s: Selected, delimeter: string): string {
    return (s === "pointer" || s === "trash") ? s : s.join(delimeter);
}

function selectedToClass(s: Selected): string {
    return joinSelected(s, " ");
}

function selectedToCursor(s: Selected): string {
    return "cursor-" + joinSelected(s, "-");;
}

function classToSelected(c: string): Selected | undefined {
    if ((c === "pointer" || c === "trash")) {
        return c;
    } else {
        const parts = c.split(/\s/);
        if (parts.length === 2) {
            return ([parts[0] as cg.Color, parts[1] as cg.Role]);
        }
    }
    
    return undefined;
}

let lastTouchMovePos: cg.NumberPair | undefined;

export interface PosBuilderProps {
    locale?: string,
    url?: string,
    dialog?: boolean,

    fen?: string,

    orientation?: cg.Color,
    showTurn?: boolean,
    coordinates?: boolean,

    size: BoardSize,
    piece?: string,
    square?: string,
    markers?: string,

    openings?: IChessOpening[],
}

export interface PosBuilderState {
    piece?: string,
    square?: string,
    size: BoardSize,

    coordinates?: boolean,
    orientation?: cg.Color,
    showTurn?: boolean,
    
    fen?: string,
    whoMove?: Colors.BW,
    castling?: CastlingStr,
    ep_target?: Squares.Square,
    halfMove?: number,
    moveNo?: number,
    
    markers?: string,
    markersVal: string,

    openings?: IChessOpening[],

    selected: Selected
}

export class PosBuilder extends React.Component<PosBuilderProps, PosBuilderState> {
    public static defaultProps: PosBuilderProps = {
        locale: "ru-ru",
        url: "https://www.chess-online.com/fen.png",
        dialog: false,

        fen: FenString.standartStart,

        orientation: "white",
        showTurn: false,
        coordinates: true,

        size: BoardSize.Normal,
        piece: "alpha",
        square: "color-blue",
        markers: "",
        openings: []
    }

    private boardElement: HTMLDivElement | null = null;
    private markElement: HTMLInputElement | null = null;

    private cg?: Api = undefined;

    private sizeChanged: boolean = false;

    constructor(props: PosBuilderProps) {
        super(props);

        i18nRegisterChess();
        register();

        const { fen, orientation, showTurn, coordinates, size, piece, square, markers } = this.props;

        const pos = new Position(fen);
        const fen2 = FenString.fromPosition(pos, FenFormat.board)
        
        this.state = {
            piece: piece,
            square: square,
            size: size,

            coordinates: coordinates,
            orientation: orientation,
            showTurn: showTurn,

            fen: fen2,
            whoMove: pos.WhoMove,
            castling: pos.Castling.asFen(),
            ep_target: pos.EpTarget,
            halfMove: pos.HalfMoveCount,
            moveNo: Chess.plyToTurn(pos.PlyCount),

            markers: markers,
            markersVal: markers || "",

            openings: [],
            selected: "pointer"
        };
    }

    componentDidMount() {
        const { state, onPositionChange, onDrawShape: onDraw } = this;
        const { orientation, coordinates, fen, whoMove, markers } = state;

        this.cg = Chessground(this.boardElement!, {
            fen: fen,
            orientation: orientation,
            turnColor: Color.toName(whoMove!),
            coordinates: !!coordinates,
            autoCastle: false,
            resizable: true,
            movable: {
                free: true,
                color: 'both'
            },
            premovable: {
                enabled: false
            },
            drawable: {
                enabled: true,
                visible: true,
                eraseOnClick: false      
            },
            draggable: {
                showGhost: true,
                deleteOnDropOff: true
            },
            selectable: {
                enabled: false
            },
            highlight: {
                lastMove: false
            },
            events: {
                change: onPositionChange
            },
        });
        this.cg.state.drawable.onChange = onDraw;
        this.assignShapes(markers);
        
        window.addEventListener("resize", this.redrawBoard);
    }

    componentWillUnmount() {
        const { cg } = this;
        if (cg !== undefined) {
            cg.destroy();
        }
        
        window.removeEventListener("resize", this.redrawBoard);
    }

    private redrawBoard = () => {
        const { cg } = this;
        if (cg !== undefined) {
            cg.redrawAll();
        }
    };

    private flipBoard = (orientation: cg.Color) => {
        const { cg } = this;
        if (cg !== undefined) {
            if (cg.state.orientation != orientation) {
                cg.toggleOrientation();
            }
        }
    };

    private updateConfig = (config: Config) => {
        const { cg } = this;

        if (cg !== undefined) {
            cg.set(config);
        }
    };

    private markersToShapes = (str?: string) => {
        const shapes: DrawShape[] = [];

        if (str !== undefined) {
            const r = /(\w+\[[\w\d]{2,4}\])/g;
            const ri = /(?<brush>[a-zA-Z]+)\[(?<orig>[a-h][1-8])(?<dest>[a-h][1-8])?\]/;
            const matches = str.match(r);
            if (matches) {
                for (let i = 0; i < matches.length; i++) {
                    const p = matches[i].match(ri);
                    if (p && p.groups) {
                        shapes.push({
                            orig: p.groups.orig as cg.Key,
                            dest: p.groups.dest as cg.Key,
                            brush: p.groups.brush,
                        });
                    }
                }
            }
        }
        
        return shapes;
    };

    private shapesToMarkers = (shapes: DrawShape[]) => {
        const marks: string[] = [];
        shapes.forEach((shape) => {
            let str = shape.brush + "[" + shape.orig;
            if (shape.dest !== undefined) {
                str += shape.dest;
            }

            str += "]";


            marks.push(str);
        });

        return marks.join(";");
    };

    private assignShapes = (shapes?: string | DrawShape[]) => {
        const { cg, markersToShapes, shapesToMarkers } = this;

        let result = "";
        if (cg !== undefined) {
            let sh: DrawShape[] = [];
            if (shapes !== undefined) {
                if (typeof shapes === "string") {
                    sh = markersToShapes(shapes);
                } else {
                    sh = shapes;
                }
            }

            cg.setShapes(sh.filter((s) => { return cg.state.drawable.brushes[s.brush] !== undefined; }));
            result = shapesToMarkers(cg.state.drawable.shapes);
        }

        return result;
    }

    private onDrawShape = (shapes: DrawShape[]) => {
        const { state } = this;
        console.log('onDrawShape', shapes);
        const markers = this.shapesToMarkers(shapes);
        this.setState({
            ...state,
            markers: markers,
            markersVal: markers
        });
    };

    private onSizeChange = (size: BoardSize) => {
        const { state } = this;
        
        this.setState({
            ...state,
            size: size
        }, () => { this.redrawBoard(); });
    };

    private onPieceChange = (piece: string) => {
        const { state } = this;
        this.setState({
            ...state,
            piece: piece
        });
    };

    private onSquareChange = (square: string) => {
        const { state } = this;
        this.setState({
            ...state,
            square: square
        });
    };

    private onFlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { cg, state } = this;
        const orientation = e.target.checked ? "black" : "white";

        this.setState({
            ...state,
            orientation: orientation
        }, () => { this.flipBoard(orientation) });
    };

    private onCoordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { state } = this;
        const coordinates = e.target.checked;

        this.setState({
            ...state,
            coordinates: coordinates
        }, () => { this.updateConfig({ coordinates: coordinates }); });
    };

    private onTurnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { state } = this;

        this.setState({
            ...state,
            showTurn: e.target.checked
        });
    };

    private onPositionChange = () => {
        const { cg, state, assignShapes } = this;
        console.log('onPositionChange', state);
        if (cg !== undefined) {
            const fen = cg.getFen();
            const shapes = state.markers;
            this.setState({
                ...state,
                fen: FenString.trim(cg.getFen(), FenFormat.board)
            }, () => { assignShapes(shapes); });
        }

        return true;
    };

    private onStartChange = (fen: string) => {
        const { state, assignShapes } = this;

        const shapes = state.markers;
        const def = FenString.toDefenition(fen);
        let cast = state.castling;
        if (def.castlingSet) {
            cast = def.castling.asFen();
        }

        this.setState({
            ...state,
            fen: def.board,
            whoMove: def.color,
            castling: cast,
            ep_target: def.eptarget,
            halfMove: def.halfMoves,
            moveNo: def.moveNo
        }, () => { 
            this.updateConfig({
                fen: def.board,
                turnColor: Color.toName(def.color)
            });

            assignShapes(shapes);
        });
    };

    private onMoverChange = (color: Colors.BW) => {
        const { state } = this;
        this.setState({
            ...state,
            whoMove: color
        }, () => { 
            this.updateConfig({
                turnColor: Color.toName(color)
            });
        });
    };

    private onCastleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { state } = this;
        const cast = new Castling(state.castling);
        if (e.target.checked) {
            cast.on(e.target.value);
        } else {
            cast.off(e.target.value);
        }

        this.setState({
            ...state,
            castling: cast.asFen()
        });
    };

    private onMoveNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { state } = this;
        const n = toSafeInteger(e.target.value);
        this.setState({
            ...state,
            moveNo: n
        });
    };

    private onEpChange? = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { state } = this;

        const ep = Square.parse(e.target.value);
        this.setState({
            ...state,
            ep_target: ep
        });
    }

    private onMarkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { state, assignShapes } = this;
        const markers = e.target.value;
        
        this.setState({
            ...state,
            markers: markers,
            markersVal: markers
        }, () => { assignShapes(markers); });
    }

    private renderCastlingGroup = (color: Colors.BW, castling?: CastlingStr) => {
        const cast = new Castling(castling);
        
        return (
            <Card>
                <Card.Header>
                    {_("chess", Color.toName(color))}
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col xs={5}>
                            <FormCheck 
                                id ="wck"
                                type="checkbox"
                                value={Piece.toChar(Piece.create(color, Piece.King))}
                                onChange={this.onCastleChange}
                                defaultChecked={cast.has(color, CastlingSide.King)}
                                label={Castling.K} />
                        </Col>
                        <Col xs={7}>
                            <FormCheck 
                                id ="wcq"
                                type="checkbox"
                                value={Piece.toChar(Piece.create(color, Piece.Queen))} 
                                onChange={this.onCastleChange} 
                                defaultChecked={cast.has(color, CastlingSide.Queen)}
                                label={Castling.Q} />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        );
    }

    private fullFen = (): string => {
        const { state } = this;
        const { fen, whoMove, castling, ep_target, halfMove, moveNo } = state;

        const cast = new Castling(castling);
        const ep = Square.isSquare(ep_target) ? Square.name(ep_target) : "-";

        return fen! + " " + Color.toChar(whoMove!) + " " + cast.asFen() + " " + ep + " " + halfMove!.toString() + " " + moveNo!.toString();
    }

    private makeLink = (fen: string, params: any[]): string => {
        let img = this.props.url || "https://www.chess-online.com/fen.png"
        img += "?fen=" + encodeURIComponent(fen);

        if (params.length > 0) {
            img += "&" + params.map(function(val){
                return val.join("=");
            }).join("&")
        }
        
        return img;
    };

    private makeCode = (fen: string, params: any[]): string => {
        let el = document.createElement("div");
        el.innerHTML = encodeURIComponent(fen);            
        
        params.forEach(element => {
            el.setAttribute(element[0], element[1]);
        });
        
        return el.outerHTML.replace(/div/g, "gc:fen");
    }

    private renderDialogButton = (visible: boolean, code: string) => {
        const executeDialog = () => {
            if (window.parent) {
                var parent_url = decodeURIComponent(document.location.hash.replace(/^#/, ""));
                var text = code;
                postMessage(text, parent_url, parent);
            }
        };

        return (visible) ? (
            <Row>
                <Col md={12} className="py-3"><Button block={true} variant="primary" onClick={executeDialog}>{_("builder", "paste_forum_code")}</Button></Col>
            </Row>
        ) : null;
    }

    private select = (value: Selected) => {
        const { state } = this;
        this.setState({
            ...state,
            selected: value
        });
    }

    private onSelectSparePiece = (s: Selected, upEvent: "mouseup" | "touchend"): (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void => {
        const that = this;
        return function(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
            const { cg, select } = that;
            e.preventDefault();
            console.log(s, upEvent);
            if (s === 'pointer' || s === 'trash') {
                select(s);
            } else {
                select('pointer');

                dragNewPiece(cg!.state, {
                    color: s[0],
                    role: s[1]
                }, e.nativeEvent as cg.MouchEvent, true);

                document.addEventListener(upEvent, (e: MouseEvent | TouchEvent) => {
                    const eventPos = eventPosition(e as cg.MouchEvent) || lastTouchMovePos;
                    if (eventPos && cg!.getKeyAtDomPos(eventPos)) {
                        select('pointer');
                    } else {
                        select(s);
                    }
                }, { once: true });
            }
        }
    };

    private renderSpare = (color: cg.Color, position: "top" | "bottom") => {
        const { onSelectSparePiece, cg, state } = this;
        const selectedClass = selectedToClass(state.selected);
        const pieces = ["king", "queen", "rook", "bishop", "knight", "pawn"].map((role): Selected => {
            return [color, role as cg.Role];
        });

        const squares: Selected[] = ["pointer", ...pieces, "trash"];

        const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
            lastTouchMovePos = eventPosition(e as any);
        };

        const renderPieces = () => {
            return squares.map((s: Selected, i) => {
                const pieceClass = selectedToClass(s);
                const selectedSquare = selectedClass === pieceClass && (
                    !cg ||
                    !cg.state.draggable.current ||
                    !cg.state.draggable.current.newPiece);

                const attrs = {
                    ...((s !== "pointer" && s !== "trash") ? {
                        "data-color": s[0],
                        "data-role": s[1]
                    } : {})
                };

                const sqClass = [
                    "no-square",
                    {
                        "pointer": s === "pointer",
                        "trash": s === "trash",
                        "selected-square": selectedSquare
                    }
                ];

                return (
                    <div key={i} className={classNames(sqClass)}>
                        <div>
                            <div className={classNames(pieceClass)} data-kind="piece"
                                onMouseDown={onSelectSparePiece(s, "mouseup")} 
                                onTouchStart={onSelectSparePiece(s, "touchend")} 
                                onTouchMove={onTouchMove} {...attrs}></div>
                        </div>
                    </div>
                );
            });
        }

        const spareClass = [
            "spare",
            `spare-${position}`, 
            `spare-${color}`
        ];


        return (
            <div className={classNames(spareClass)}>
                { renderPieces() }
            </div>
        );
    };

    private downKey: cg.Key | undefined;
    private lastKey: cg.Key | undefined;
    private placeDelete: boolean | undefined;

    private deleteOrHidePiece = (key: cg.Key, e: Event) => {
        const { deletePiece, cg } = this;

        if (e.type === 'touchstart') {
            if (cg!.state.pieces.get(key)) {
              (cg!.state.draggable.current!.element as HTMLElement).style.display = 'none';
              cg!.cancelMove();
            }

            document.addEventListener('touchend', () => deletePiece(key), { once: true });
        } else if (e.type === 'mousedown' || key !== this.downKey) {
            deletePiece(key);
        }
    };

    private deletePiece = (key: cg.Key): void => {
        const { cg } = this;

        cg!.setPieces(new Map([
          [key, undefined]
        ]));
        
        this.onPositionChange();
    };

    private boardEvent = (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
        function isLeftButton(e: MouseEvent | TouchEvent): boolean {
            return (e instanceof MouseEvent) && (e.buttons === 1 || e.button === 1);
        }
          
        function isLeftClick(e: MouseEvent | TouchEvent): boolean {
            return isLeftButton(e) && !e.ctrlKey;
        }

        function isRightClick(e: MouseEvent | TouchEvent): boolean {
            return ((e instanceof MouseEvent) && isRightButtonEvent(e)) || (e.ctrlKey && isLeftButton(e));
        }

        const { state, cg, deleteOrHidePiece } = this;
        const sel = state.selected;
        // do not generate corresponding mouse event
        // (https://developer.mozilla.org/en-US/docs/Web/API/Touch_events/Supporting_both_TouchEvent_and_MouseEvent)
        if (sel !== 'pointer' && e.cancelable !== false && (e.type === 'touchstart' || e.type === 'touchmove')) {
            e.preventDefault();
        }

        if (isLeftClick(e.nativeEvent) || e.type === 'touchstart' || e.type === 'touchmove') {
            if (sel === 'pointer' || (cg && cg.state.draggable.current && cg.state.draggable.current.newPiece)) {
                return;
            }

            const pos = eventPosition(e.nativeEvent as cg.MouchEvent);
            if (!pos) {
                return;
            }

            const key = cg!.getKeyAtDomPos(pos);
            if (!key) {
                return;
            }

            if (e.type === 'mousedown' || e.type === 'touchstart') this.downKey = key;
            if (sel === 'trash') {
                deleteOrHidePiece(key, e.nativeEvent);
            } else {
                const existingPiece = cg!.state.pieces.get(key);
                const piece = {
                    color: sel[0],
                    role: sel[1]
                };
                
                const samePiece = existingPiece && piece.color == existingPiece.color && piece.role == existingPiece.role;

                if ((e.type === 'mousedown' || e.type === 'touchstart') && samePiece) {
                    deleteOrHidePiece(key, e.nativeEvent);
                    this.placeDelete = true;
                    const endEvents = { mousedown: 'mouseup', touchstart: 'touchend' };
                    document.addEventListener(endEvents[e.type], () => this.placeDelete = false, { once: true });
                } else if (!this.placeDelete && (e.type === 'mousedown' || e.type === 'touchstart' || key !== this.lastKey)) {
                    cg!.setPieces(new Map([
                        [key, piece]
                    ]));

                    this.onPositionChange();
                    cg!.cancelMove();
                }
            }

            this.lastKey = key;


        } else if (isRightClick(e.nativeEvent)) {

        }
    }

    render() {
        const { props, state, fullFen, makeLink, makeCode, renderDialogButton, renderSpare, shapesToMarkers, markersToShapes, boardEvent } = this;
        const { dialog } = props;
        const { whoMove, castling, ep_target, openings, size, orientation, showTurn, moveNo, coordinates, piece, square, markers, markersVal, selected } = state;

        const flipped = orientation != "white";
        const fenStr = fullFen();

        const shapes = markersToShapes(markers);
        const marks = shapesToMarkers(shapes);

        let params: any[] = [];
        pushif(params, (size !== 2), ["size", size]);
        pushif(params, flipped, ["fb", 1]);
        pushif(params, !!showTurn, ["who", 1]);
		pushif(params, !coordinates, ["hl", 1]);
        pushif(params, (piece !== PosBuilder.defaultProps.piece), ["pset", encodeURIComponent(piece!)]);
        pushif(params, (square !== PosBuilder.defaultProps.square), ["sset", encodeURIComponent(square!)]);
        pushif(params, !!markers, ["mv", encodeURIComponent(marks)]);

        const code = makeCode(fenStr, params);

        const containerClass = [
            "pos-builder", 
            "is2d",
            square,
            BoardSizeClass[size],
            { "coords-no": !coordinates }
        ];

        const cursor = selectedToCursor(selected);
                
        return (
            <Container className={classNames(containerClass)}>
                <Row>
                    <Col md={12}>
                        <div className="d-block d-lg-flex">
                            <div className={classNames("board-container", piece)}>
                                <div className="holder-container">
                                    { renderSpare((flipped ? "white": "black"), "top") }
                                </div>
                                <div className={classNames(cursor)}
                                    onTouchStart={boardEvent}
                                    onTouchMove={boardEvent}
                                    onMouseDown={boardEvent}
                                    onMouseMove={boardEvent}
                                    onContextMenu={boardEvent}>
                                    <div className="main-board" ref={el => this.boardElement = el} />
                                </div>
                                <div className="holder-container">
                                    { renderSpare((flipped ? "black": "white"), "bottom") }
                                </div>

                                {renderDialogButton(!!dialog, code)}
                                <div>
                                    <div className="code-row">
                                        <Row>
                                            <Col md={12}>
                                                <FormGroup controlId="fen">
                                                    <FormLabel>{_("chess", "fen")}</FormLabel>
                                                    <TextWithCopy value={fenStr} size="sm" placeholder={_("chess", "fen")} />
                                                </FormGroup>    
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={12}>
                                                <FormGroup controlId="image_link">
                                                    <FormLabel>{_("builder", "image_link")}</FormLabel>
                                                    <TextWithCopy value={makeLink(fenStr, params)} size="sm" placeholder={_("builder", "image_link")} />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={12}>
                                                <FormGroup controlId="forum_code">
                                                    <FormLabel>{_("builder", "forum_code")}</FormLabel>
                                                    <TextWithCopy value={code} size="sm" placeholder={_("builder", "forum_code")} />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                            </div>
                            <div className="controls flex-grow-1 pl-lg-4">
                                <div className="pos-sets">
                                    <Row>
                                        <Col md={4}>
                                            <FormGroup controlId="size">
                                                <FormLabel>{_("builder", "board_size")}</FormLabel>
                                                <SizeSelector defaultValue={size} onChangeSize={this.onSizeChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup controlId="piece">
                                                <FormLabel>{_("chess", "pieces")}</FormLabel>
                                                <PieceSelector defaultValue={piece} onChangePiece={this.onPieceChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup controlId="square">
                                                <FormLabel>{_("chess", "squares")}</FormLabel>
                                                <SquareSelector defaultValue={square} onChangeSquare={this.onSquareChange} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-start">
                                    <Row>
                                        <Col md={8} sm={12}>
                                            <FormGroup controlId="startpos">
                                                <FormLabel srOnly={true}>{_("builder", "position_label")}</FormLabel>
                                                <StartPosSelector fen={fenStr} openingsPos={openings} onChangeFen={this.onStartChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4} sm={12}>
                                            <FormGroup controlId="who_move">
                                                <FormLabel srOnly={true}>{_("chess", "who_move")}</FormLabel>
                                                <WhoMoveSelector defaultValue={whoMove} onChangeTurn={this.onMoverChange} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-params">
                                    <div><strong>{_("builder", "pos_param")}</strong></div>
                                    <Row>
                                        <Col md={3} sm={6}>
                                            <FormGroup controlId="moveNo">
                                                <FormLabel>{_("chess", "move_no")}</FormLabel>
                                                <FormControl 
                                                    size="sm" 
                                                    defaultValue={moveNo!.toString()} 
                                                    onChange={this.onMoveNoChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormGroup controlId="epTarget">
                                                <FormLabel>{_("chess", "ep_target")}</FormLabel>
                                                <FormControl 
                                                    size="sm"
                                                    defaultValue={ep_target} 
                                                    title={_("builder", "ep_target_hint")} 
                                                    onChange={this.onEpChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup controlId="marks">
                                                <FormLabel>{_("builder", "marks")}</FormLabel>
                                                <FormControl 
                                                    size="sm"
                                                    value={markersVal}
                                                    title={_("builder", "marks_hint")}
                                                    onChange={this.onMarkChange} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-castle">
                                    <div><strong>{_("chess", "castle")}</strong></div>
                                    <Row>
                                        <Col md={6}>
                                            {this.renderCastlingGroup(Color.White, castling)}
                                        </Col>
                                        <Col md={6}>
                                            {this.renderCastlingGroup(Color.Black, castling)}
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
                                                defaultChecked={flipped}
                                                label={_("builder", "display_flip")} />
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormCheck 
                                                id ="coords" 
                                                type="checkbox"
                                                value="1" 
                                                onChange={this.onCoordsChange} 
                                                defaultChecked={coordinates}
                                                label={_("builder", "display_coord")} />
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormCheck 
                                                id ="turn" 
                                                type="checkbox"
                                                value="1" 
                                                onChange={this.onTurnChange} 
                                                defaultChecked={showTurn}
                                                label={_("builder", "display_showturn")} />
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        );
    }
}

export const PositionSetup = (props: PosBuilderProps, container: HTMLElement) => {
    ReactDOM.render(React.createElement(PosBuilder, props), container);
};