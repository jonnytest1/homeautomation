import { Component, Inject, OnInit, Optional, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Vector2 } from '../../util/vector';
import { Collection } from '../../wirings/collection';
import { Relay } from '../../wirings/relay';
import { Switch } from '../../wirings/switch';
import { Wire } from '../../wirings/wire';
import { InOutComponent, positionInjectionToken } from '../in-out/in-out.component';
import { UINode } from '../ui-node.a';


class NestedSwitch extends UINode<Switch>{
    inOutComponent?: InOutComponent;
    getIcon(): string {
        throw new Error('Method not implemented.');
    }




}


@Component({
    selector: 'app-relay-ui',
    templateUrl: './relay-ui.component.html',
    styleUrls: ['./relay-ui.component.less']
})
export class RelayUiComponent extends UINode<Relay> implements OnInit {
    public static templateIcon = "asset:/assets/icons/relay.png"

    @ViewChild(InOutComponent)
    inOutComponent?: InOutComponent;

    @ViewChild("innerSwitch", { read: InOutComponent })
    innerSwitchInOut?: InOutComponent;

    @ViewChild("outerSwitch", { read: InOutComponent })
    outerSwitchInOut?: InOutComponent;
    snackbarRef: any;

    public switchRef: Switch;

    mainOffset = new Vector2(-10, -9)

    innerSwitchOffset = new Vector2(20, 14)
    outerSwitchOffset = new Vector2(40, 16)
    innerSwitchRef: Switch;
    outerSwitchRef: Switch;
    nestedSwitchColelction: Collection;
    switch2uiNode: NestedSwitch;

    constructor(private snackbar: MatSnackBar) {
        super(new Relay())


    }
    getWires(): Array<Wire> {
        const wires = []
        if (this.node?.inC?.connectedTo) {
            wires.push(this.node?.inC?.connectedTo)
        }
        if (this.node?.outC?.connectedTo) {
            wires.push(this.node?.outC?.connectedTo)
        }
        if (this.node.switch1.outC.connectedTo) {
            wires.push(this.node.switch1.outC.connectedTo)
        }
        if (this.node.switch1.inC.connectedTo) {
            wires.push(this.node.switch1.inC.connectedTo)
        }
        if (this.node.switch1.negatedOutC.connectedTo) {
            wires.push(this.node.switch1.negatedOutC.connectedTo)
        }
        return wires
    }
    toggleRelay() {
        this.node.setSwitchOneEnabled(!this.node.switch1.enabled)
    }

    ngOnInit() {
        this.node.switch1.uiNode = new NestedSwitch(this.node.switch1);
        this.switch2uiNode = new NestedSwitch({} as any);
        this.nestedSwitchColelction = new Collection(null, this.node.switch1.negatedOutC)
    }

    setPosition(vector: Vector2): void {
        super.setPosition(vector)
        if (this.node.switch1.uiNode?.inOutComponent) {
            this.node.switch1.uiNode.inOutComponent.position = vector
        }
        if (this.switch2uiNode?.inOutComponent) {
            this.switch2uiNode.inOutComponent.position = vector
        }
    }

    ngAfterViewInit() {
        this.node.switch1.uiNode.inOutComponent = this.outerSwitchInOut
        this.switch2uiNode.inOutComponent = this.innerSwitchInOut
    }
    getIcon(): string {
        if (!this.node.switch1.enabled) {
            return `/assets/icons/relay.png`
        }
        return `/assets/icons/relay_right.png`
    }

    openSnackbar(template: TemplateRef<any>) {
        this.snackbarRef = this.snackbar.openFromTemplate(template)
    }

}
