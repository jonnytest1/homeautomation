import { Component, Inject, OnInit, Optional, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Vector2 } from '../../util/vector';
import { Collection } from '../../wirings/collection';
import { Relay } from '../../wirings/relay';
import { Switch } from '../../wirings/switch';
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

    mainOffset = new Vector2(-20, -10)

    innerSwitchOffset = new Vector2(120, -20)
    outerSwitchOffset = new Vector2(40, 16)
    innerSwitchRef: Switch;
    outerSwitchRef: Switch;
    nestedSwitchColelction: Collection;
    switch2uiNode: NestedSwitch;

    constructor(private snackbar: MatSnackBar) {
        super(new Relay())

        this.node.switch1.uiNode = new NestedSwitch(this.node.switch1);
        this.switch2uiNode = new NestedSwitch({} as any);
        this.nestedSwitchColelction = new Collection(null, this.node.switch1.negatedOutC)
    }

    toggleRelay() {
        this.node.setSwitchOneEnabled(!this.node.switch1.enabled)
    }

    ngOnInit() {
    }

    setPosition(vector: Vector2): void {
        super.setPosition(vector)
        if (this.node.switch1.uiNode.inOutComponent) {
            this.node.switch1.uiNode.inOutComponent.position = vector
        }
        if (this.switch2uiNode.inOutComponent) {
            this.switch2uiNode.inOutComponent.position = vector
        }
    }

    ngAfterViewInit() {
        this.node.switch1.uiNode.inOutComponent = this.innerSwitchInOut
        this.switch2uiNode.inOutComponent = this.outerSwitchInOut
    }
    getIcon(): string {
        return `/assets/icons/relay.png`
    }

    openSnackbar(template: TemplateRef<any>) {
        this.snackbarRef = this.snackbar.openFromTemplate(template)
    }

}
