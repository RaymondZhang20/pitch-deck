import {
  _decorator,
  assetManager,
  Component,
  director,
  instantiate,
  isValid,
  Label,
  Layout,
  Mask,
  Node,
  Prefab,
  ScrollView,
  Size,
  Sprite,
  UITransform,
  Vec3,
  Widget,
} from "cc";
import { setFlagByCode } from "./FlagUtils";

const { ccclass, property } = _decorator;

type MatchExample = {
  time: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeFlagCode: string;
  awayFlagCode: string;
};

@ccclass("PredictionListController")
export class PredictionListController extends Component {
  private static readonly MATCH_ITEM_PREFAB_UUID =
    "449bc894-71b2-412a-905a-c3cbc4b72043";
  private static readonly EXAMPLES: MatchExample[] = [
    {
      time: "06/18 20:00",
      status: "\u672a\u5f00\u59cb",
      homeTeam: "\u65e5\u672c",
      awayTeam: "\u97e9\u56fd",
      homeFlagCode: "jp",
      awayFlagCode: "kr",
    },
    {
      time: "06/19 19:30",
      status: "\u672a\u5f00\u59cb",
      homeTeam: "\u7f8e\u56fd",
      awayTeam: "\u58a8\u897f\u54e5",
      homeFlagCode: "us",
      awayFlagCode: "mx",
    },
    {
      time: "06/20 18:00",
      status: "\u672a\u5f00\u59cb",
      homeTeam: "\u82f1\u683c\u5170",
      awayTeam: "\u8461\u8404\u7259",
      homeFlagCode: "gb-eng",
      awayFlagCode: "pt",
    },
    {
      time: "06/21 21:15",
      status: "\u672a\u5f00\u59cb",
      homeTeam: "\u5df4\u897f",
      awayTeam: "\u963f\u6839\u5ef7",
      homeFlagCode: "br",
      awayFlagCode: "ar",
    },
    {
      time: "06/22 17:45",
      status: "\u672a\u5f00\u59cb",
      homeTeam: "\u897f\u73ed\u7259",
      awayTeam: "\u6cd5\u56fd",
      homeFlagCode: "es",
      awayFlagCode: "fr",
    },
    {
      time: "06/23 19:00",
      status: "\u672a\u5f00\u59cb",
      homeTeam: "\u8377\u5170",
      awayTeam: "\u5fb7\u56fd",
      homeFlagCode: "nl",
      awayFlagCode: "de",
    },
    {
      time: "06/24 20:30",
      status: "\u672a\u5f00\u59cb",
      homeTeam: "\u97e9\u56fd",
      awayTeam: "\u6fb3\u5927\u5229\u4e9a",
      homeFlagCode: "kr",
      awayFlagCode: "au",
    },
    {
      time: "06/25 18:30",
      status: "\u672a\u5f00\u59cb",
      homeTeam: "\u6469\u6d1b\u54e5",
      awayTeam: "\u5c3c\u65e5\u5229\u4e9a",
      homeFlagCode: "ma",
      awayFlagCode: "ng",
    },
    {
      time: "06/26 22:00",
      status: "\u672a\u5f00\u59cb",
      homeTeam: "\u514b\u7f57\u5730\u4e9a",
      awayTeam: "\u745e\u58eb",
      homeFlagCode: "hr",
      awayFlagCode: "ch",
    },
    {
      time: "06/27 16:00",
      status: "\u672a\u5f00\u59cb",
      homeTeam: "\u58a8\u897f\u54e5",
      awayTeam: "\u52a0\u62ff\u5927",
      homeFlagCode: "mx",
      awayFlagCode: "ca",
    },
    {
      time: "06/28 20:45",
      status: "\u672a\u5f00\u59cb",
      homeTeam: "\u5361\u5854\u5c14",
      awayTeam: "\u4f0a\u6717",
      homeFlagCode: "qa",
      awayFlagCode: "ir",
    },
  ];

  @property(Node)
  public returnBtn: Node | null = null;

  onLoad(): void {
    this.bindEvents();
    void this.setupExamples();
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
          "[PredictionListController] Failed to load scene: HomeScene",
          err,
        );
      }
    });
  }

  private async setupExamples(): Promise<void> {
    const exampleList = this.ensureMatchItemList();
    if (!exampleList || exampleList.children.length > 0) {
      return;
    }

    try {
      const prefab = await this.loadAsset<Prefab>(
        PredictionListController.MATCH_ITEM_PREFAB_UUID,
      );

      for (let i = 0; i < PredictionListController.EXAMPLES.length; i += 1) {
        const example = PredictionListController.EXAMPLES[i];
        const card = instantiate(prefab);
        card.name = `ExampleMatchItem${i + 1}`;
        exampleList.addChild(card);
        card.setPosition(Vec3.ZERO);
        this.configureTeamInfoLayout(card);

        this.setLabel(card, "TimeLabel", example.time);
        this.setLabel(card, "StatusTag", example.status);
        this.setLabel(card, "StatusLabel", example.status);
        this.setLabel(card, "HomeTeamInfo/Name", example.homeTeam);
        this.setLabel(card, "AwayTeamInfo/Name", example.awayTeam);
        await this.trySetFlag(card, "HomeTeamInfo/Flag", example.homeFlagCode);
        await this.trySetFlag(card, "AwayTeamInfo/Flag", example.awayFlagCode);
      }

      const layout = exampleList.getComponent(Layout);
      layout?.updateLayout();

      const scrollView = exampleList.parent?.getComponent(ScrollView);
      if (scrollView) {
        this.scheduleOnce(() => {
          scrollView.scrollToTop(0);
        }, 0);
      }
    } catch (error) {
      console.error(
        "[PredictionListController] Failed to create example items",
        error,
      );
    }
  }

  private ensureMatchItemList(): Node | null {
    const canvas = this.node.parent;
    const matchItemList = canvas?.getChildByName("MatchItemList") ?? null;
    if (!canvas || !matchItemList) {
      return null;
    }

    let scrollNode = canvas.getChildByName("MatchScrollView");
    if (!scrollNode) {
      scrollNode = new Node("MatchScrollView");
      canvas.addChild(scrollNode);

      const scrollTransform = scrollNode.addComponent(UITransform);
      scrollTransform.setContentSize(new Size(710, 1280));

      const scrollWidget = scrollNode.addComponent(Widget);
      scrollWidget.isAlignLeft = true;
      scrollWidget.isAlignRight = true;
      scrollWidget.isAlignTop = true;
      scrollWidget.isAlignBottom = true;
      scrollWidget.left = 20;
      scrollWidget.right = 20;
      scrollWidget.top = 180;
      scrollWidget.bottom = 80;
      scrollWidget.alignMode = 2;

      scrollNode.addComponent(Mask);
      const scrollView = scrollNode.addComponent(ScrollView);
      scrollView.horizontal = false;
      scrollView.vertical = true;
      scrollView.inertia = true;
      scrollView.brake = 0.35;

      matchItemList.removeFromParent();
      scrollNode.addChild(matchItemList);
      scrollView.content = matchItemList;
    }

    const scrollTransform = scrollNode.getComponent(UITransform);
    const contentTransform =
      matchItemList.getComponent(UITransform) ??
      matchItemList.addComponent(UITransform);
    // const contentWidget = matchItemList.getComponent(Widget);
    // if (contentWidget) {
    //   contentWidget.enabled = false;
    // }

    // matchItemList.setScale(1, 1, 1);
    const contentWidth = Math.max(
      (scrollTransform?.contentSize.width ?? 710) - 20,
      680,
    );
    contentTransform.setContentSize(new Size(contentWidth, 0));
    contentTransform.setAnchorPoint(0.5, 1);
    matchItemList.setPosition(
      new Vec3(0, (scrollTransform?.contentSize.height ?? 1280) / 2, 0),
    );

    let layout = matchItemList.getComponent(Layout);
    if (!layout) {
      layout = matchItemList.addComponent(Layout);
    }

    layout.type = Layout.Type.VERTICAL;
    layout.resizeMode = Layout.ResizeMode.CONTAINER;
    layout.verticalDirection = Layout.VerticalDirection.TOP_TO_BOTTOM;
    layout.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
    layout.spacingY = 50;
    layout.paddingTop = 0;
    layout.paddingBottom = 0;
    layout.paddingLeft = 0;
    layout.paddingRight = 0;
    layout.affectedByScale = false;

    return matchItemList;
  }

  private loadAsset<T>(uuid: string): Promise<T> {
    return new Promise((resolve, reject) => {
      assetManager.loadAny(uuid, (err, asset) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(asset as T);
      });
    });
  }

  private setLabel(root: Node, path: string, value: string): void {
    const target = this.getNodeByPath(root, path);
    const label = target?.getComponent(Label);
    if (label) {
      label.string = value;
    }
  }

  private async setFlag(root: Node, path: string, code: string): Promise<void> {
    const target = this.getNodeByPath(root, path);
    const sprite = target?.getComponent(Sprite);
    if (!sprite) {
      console.warn(
        "[PredictionListController] Flag sprite target not found",
        path,
      );
      return;
    }

    await setFlagByCode(sprite, code);
  }

  private async trySetFlag(
    root: Node,
    path: string,
    code: string,
  ): Promise<void> {
    try {
      await this.setFlag(root, path, code);
    } catch (error) {
      console.warn(
        "[PredictionListController] Failed to set flag",
        { path, code },
        error,
      );
    }
  }

  private configureTeamInfoLayout(card: Node): void {
    this.pinNodeToParent(card, "HomeTeamInfo/Flag", {
      left: 0,
      verticalCenter: 0,
    });
    this.pinNodeToParent(card, "HomeTeamInfo/Name", {
      right: 0,
      verticalCenter: 0,
    });
    this.pinNodeToParent(card, "AwayTeamInfo/Name", {
      left: 0,
      verticalCenter: 0,
    });
    this.pinNodeToParent(card, "AwayTeamInfo/Flag", {
      right: 0,
      verticalCenter: 0,
    });
  }

  private pinNodeToParent(
    root: Node,
    path: string,
    options: {
      left?: number;
      right?: number;
      verticalCenter?: number;
    },
  ): void {
    const node = this.getNodeByPath(root, path);
    if (!node) {
      return;
    }

    let widget = node.getComponent(Widget);
    if (!widget) {
      widget = node.addComponent(Widget);
    }

    widget.target = node.parent;
    widget.isAlignLeft = options.left !== undefined;
    widget.isAlignRight = options.right !== undefined;
    widget.isAlignVerticalCenter = options.verticalCenter !== undefined;

    if (options.left !== undefined) {
      widget.left = options.left;
    }

    if (options.right !== undefined) {
      widget.right = options.right;
    }

    if (options.verticalCenter !== undefined) {
      widget.verticalCenter = options.verticalCenter;
    }

    widget.alignMode = 2;
    widget.updateAlignment();
  }

  private getNodeByPath(root: Node, path: string): Node | null {
    const parts = path.split("/");
    let current: Node | null = root;

    for (const part of parts) {
      current = current?.getChildByName(part) ?? null;
      if (!current) {
        return null;
      }
    }

    return current;
  }
}
