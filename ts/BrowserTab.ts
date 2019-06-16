import Status from "./Status";

export default class BrowserTab {
    
    id: string;
    subid: string;
    code: Status;
    index: number;
    counter: number;
    
    constructor(id: string, index: number, subid: string, status: Status = Status.denied, counter: number = 0) {
        this.id = id;
        this.subid = subid;
        this.index = index;
        this.code = status;
        this.counter = counter;
    }
}