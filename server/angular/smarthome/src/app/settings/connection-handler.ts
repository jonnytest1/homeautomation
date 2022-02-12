import { ConnectionFe, ReceiverFe, SenderFe } from './interfaces';
import { SettingsService } from '../data.service';
import { CanvasUtil } from '../utils/context';


export class ConnectionHandler {


    addingSender: SenderFe;

    activeSender: SenderFe;
    util: CanvasUtil;

    constructor(private service: SettingsService, private snackOpen: (data: { con: ConnectionFe, sender: SenderFe }) => void) {

    }

    setCanvas(nativeCanvas: HTMLCanvasElement) {
        this.util = new CanvasUtil(nativeCanvas);
    }

    setAcvtiveSender(sender: SenderFe) {
        if (sender !== this.activeSender) {
            this.activeSender = sender;
            this.drawConnections();
        }
    }

    drawConnections() {
        if (!this.util) {
            return;
        }
        const nativeCanvas = this.util.canvas;

        const height = getComputedStyle(nativeCanvas.parentElement).height;
        nativeCanvas.height = +height.replace('px', '');

        this.util.reset();

        if (!this.activeSender || !this.activeSender.connections) {
            return;
        }
        const senders: NodeListOf<HTMLElement> = nativeCanvas.parentElement.parentElement.querySelectorAll('.sender');
        const receivers: NodeListOf<HTMLElement> = nativeCanvas.parentElement.parentElement.querySelectorAll('.receiver');
        let startY;
        let endY;

        const offsetMod = -34;
        receivers.forEach(receiver => {
            const connection = this.activeSender.connections
                .find(con => `${con.receiver.id}` === receiver.attributes.getNamedItem('item').value);
            if (connection) {
                const top = receiver.offsetTop + offsetMod;
                const heightForSender = Math.floor((top + (top + receiver.offsetHeight)) / 2);

                if (!startY || heightForSender < startY) {
                    startY = heightForSender;
                }
                if (!endY || heightForSender > endY) {
                    endY = heightForSender;
                }
                const sender = this.activeSender;
                this.util.line({
                    from: { x: 'center', y: heightForSender },
                    to: { x: this.util.width - 12, y: heightForSender },
                    click: (event: MouseEvent) => {
                        this.snackOpen({ con: connection, sender });
                        event.stopPropagation();
                    }
                });
            }
        });

        senders.forEach(sender => {
            if (sender.attributes.getNamedItem('item').value === `${this.activeSender.id}`) {
                const iconElement = sender.parentElement.querySelector<HTMLElement>('.mat-icon.startConnection');
                const top = iconElement.offsetTop;
                const heightForSender = Math.floor((top - 1 + (top + iconElement.offsetHeight)) / 2);
                if (!startY || heightForSender < startY) {
                    startY = heightForSender;
                }
                if (!endY || heightForSender > endY) {
                    endY = heightForSender;
                }
                this.util.line({
                    from: { x: 12, y: heightForSender },
                    to: { x: 'center', y: heightForSender }
                });
            }
        });

        this.util.line({
            from: { x: 'center', y: startY },
            to: { x: 'center', y: endY }
        });
    }

    startAdd(sender: SenderFe) {
        this.addingSender = sender;
        if (this.activeSender !== sender) {
            this.activeSender = sender;
            this.drawConnections();
        }
    }

    async addConnection(item: ReceiverFe): Promise<ConnectionFe> {
        if (this.addingSender) {
            if (!this.addingSender.connections) {
                this.addingSender.connections = [];
            }
            let highestId = -1;
            if (this.addingSender.connections.some(c => {
                if (highestId < +c.id) {
                    highestId = +c.id;
                }
                return c.receiver.id === item.id;
            })) {
                this.addingSender = undefined;
                return null;
            }
            const newConnection: ConnectionFe = {
                receiver: item,
                transformation: {},
                id: highestId + 10
            };
            this.addingSender.connections.push(newConnection);
            const connection = await this.service.addConnection(this.activeSender.deviceKey, item.id).toPromise();

            newConnection.id = connection.id;
            newConnection.transformation.id = connection.transformation.id;

            this.addingSender = undefined;
            this.drawConnections();
            return newConnection;
        }
        this.addingSender = undefined;
        return null;

    }


    reset() {
        this.addingSender = undefined;
    }

}
