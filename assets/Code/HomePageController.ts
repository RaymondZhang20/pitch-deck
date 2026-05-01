import { _decorator, Component, Node, director, isValid } from "cc";
const { ccclass, property } = _decorator;

@ccclass("HomePageController")
export class HomePageController extends Component {
  @property(Node)
  public mainBtn: Node | null = null;

  @property(Node)
  public subBtn: Node | null = null;

  onLoad() {
    this.bindEvents();
  }

  private bindEvents(): void {
    if (this.mainBtn && isValid(this.mainBtn)) {
      this.mainBtn.on(Node.EventType.TOUCH_END, this.onClickMainBtn, this);
    }

    if (this.subBtn && isValid(this.subBtn)) {
      this.subBtn.on(Node.EventType.TOUCH_END, this.onClickSubBtn, this);
    }
  }

  /**
   * 主按钮：参加预测
   * 跳转到 PredictionList Scene
   */
  private onClickMainBtn(): void {
    director.loadScene("PredictionList", (err) => {
      if (err) {
        console.error(
          "[HomePageController] Failed to load scene: PredictionList",
          err,
        );
      }
    });
  }

  /**
   * 次按钮：我的战绩
   * 跳转到 HistoryList Scene
   */
  private onClickSubBtn(): void {
    director.loadScene("HistoryList", (err) => {
      if (err) {
        console.error(
          "[HomePageController] Failed to load scene: HistoryList",
          err,
        );
      }
    });
  }
}
