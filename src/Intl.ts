import { Intl as IntlCore } from 'onix-core';
import { Intl as IntlBoard } from 'onix-board';
import { Intl as IntlCtrl } from 'onix-chess-ctrls';

export class Intl {
    private static intlInitialized = false;

    public static register() {
        if (!Intl.intlInitialized) {
            
            IntlBoard.register();
            IntlCtrl.register();

            IntlCore.registerStrings('builder', {
                'ru-ru': {
                    pb_title: "Конструктор шахматной позиции",
                    image_link: "URL",
                    forum_code: "CODE",
                    paste_forum_code: "Вставить в сообщение",
                    pos_param: "Параметры позиции",
                    ep_target_hint: "Поле для взятия на проходе (если последний ход был ход пешкой на 2 горизонтали)",
                    set_board: "Установить позицию",
                    std_fen: "Стартовая позиция",
                    empty_fen: "Пустая доска",
                    pos_diplay: "Отображение",
                    display_flip: "Разворот",
                    display_coord: "Координаты",
                    display_frame: "Рамка",
                    display_moveturn: "Очередь хода",
                    marks: "Маркеры",
                    marks_hint: "Для установки маркеров укажите наименования клеток или ходов через запятую (например e2-e4,d5,h4)",
                    copy_to_clipboard: "Копировать в буфер обмена",
                },

                'en-us': {
                    pb_title: "Chess position builder",
                    image_link: "URL",
                    forum_code: "CODE",
                    paste_forum_code: "Paste to message body",
                    pos_param: "Posittion settings",
                    ep_target_hint: "En passant square (unless the last pawn's move was on the 2 horizontal)",
                    set_board: "Set the board",
                    std_fen: "Standart start",
                    empty_fen: "Empty board",
                    pos_diplay: "Display",
                    display_flip: "Flip board",
                    display_coord: "Coordinates",
                    display_frame: "Frame",
                    display_moveturn: "Move turn",
                    marks: "Markers",
                    marks_hint: "Entry square or move names for marks (example e2-e4,d5,h4)",
                    copy_to_clipboard: "Copy to clipboard",
                }
            });

            Intl.intlInitialized = true;
        }
    }
}

