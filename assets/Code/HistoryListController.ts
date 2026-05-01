import { _decorator, Component, Node, director, isValid } from "cc";

const { ccclass, property } = _decorator;

@ccclass("HistoryListController")
export class HistoryListController extends Component {
  @property(Node)
  public returnBtn: Node | null = null;

  onLoad(): void {
    this.bindEvents();
  }

  onDestroy(): void {
    if (this.returnBtn && isValid(this.returnBtn)) {
      this.returnBtn.off(Node.EventType.TOUCH_END, this.onClickReturnBtn, this);
    }
  }

  private bindEvents(): void {
    if (this.returnBtn && isValid(this.returnBtn)) {
      this.returnBtn.on(Node.EventType.TOUCH_END, this.onClickReturnBtn, this);
    }
  }

  private onClickReturnBtn(): void {
    director.loadScene("HomeScene", (err) => {
      if (err) {
        console.error(
          "[HistoryListController] Failed to load scene: HomeScene",
          err,
        );
      }
    });
  }
}
