import { DataHolder } from '../../data-holder';
import { SenderFe, TransformFe } from '../../interfaces';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-mobile-sender',
  templateUrl: './mobile-sender.component.html',
  styleUrls: ['./mobile-sender.component.less']
})
export class MobileSenderComponent implements OnInit {


  sender$: Observable<SenderFe>;


  transformer: TransformFe = {}
  constructor(private activeRoute: ActivatedRoute, dataHolder: DataHolder) {

    this.sender$ = dataHolder.getSenders().pipe(
      map(senders => senders.find(sender => sender.id == +this.activeRoute.snapshot.params.id))
    )
  }

  ngOnInit() {
    //
  }


  debug(sender) {
    //console.log(sender)
  }
}
