
export class LinkedDateEventList<V> {
  next?: LinkedDateEventList<V>

  constructor(public value?: { timestamp?: Date, data: V }) {

  }

  add(element: { timestamp?: Date, data: V }) {

    if (this.next === undefined) {
      this.next = new LinkedDateEventList(element)
    } else {
      if (element.timestamp! > this.next.value!.timestamp!) {
        this.next.add(element)
      } else {
        const previousNext = this.next
        this.next = new LinkedDateEventList(element)
        this.next.next = previousNext
      }
    }
  }

  shift() {
    this.next = this.next!.next
  }

}