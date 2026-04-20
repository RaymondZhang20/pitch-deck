import {
  _decorator,
  Button,
  Component,
  director,
  instantiate,
  isValid,
  Label,
  Layout,
  Mask,
  Node,
  Prefab,
  resources,
  ScrollView,
  Size,
  Sprite,
  UITransform,
  Vec3,
  Widget,
} from "cc";
import { setFlagByCode } from "./FlagUtils";
import { setSelectedMatchInfo } from "./MatchSelectionState";

const { ccclass, property } = _decorator;

type MatchExample = {
  matchId: string;
  time: string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  homeFlagCode: string;
  awayFlagCode: string;
};

@ccclass("PredictionListController")
export class PredictionListController extends Component {
  private static readonly EXAMPLES: MatchExample[] = [
    {
      matchId: "match-001",
      time: "06/18 20:00",
      status: "未开始",
      homeTeam: "日本",
      awayTeam: "韩国",
      homeFlagCode: "jp",
      awayFlagCode: "kr",
    },
    {
      matchId: "match-002",
      time: "06/19 19:30",
      status: "未开始",
      homeTeam: "美国",
      awayTeam: "墨西哥",
      homeFlagCode: "us",
      awayFlagCode: "mx",
    },
    {
      matchId: "match-003",
      time: "06/20 18:00",
      status: "未开始",
      homeTeam: "英格兰",
      awayTeam: "葡萄牙",
      homeFlagCode: "gb-eng",
      awayFlagCode: "pt",
    },
    {
      matchId: "match-004",
      time: "06/21 21:15",
      status: "未开始",
      homeTeam: "巴西",
      awayTeam: "阿根廷",
      homeFlagCode: "br",
      awayFlagCode: "ar",
    },
    {
      matchId: "match-005",
      time: "06/22 17:45",
      status: "未开始",
      homeTeam: "西班牙",
      awayTeam: "法国",
      homeFlagCode: "es",
      awayFlagCode: "fr",
    },
    {
      matchId: "match-006",
      time: "06/23 19:00",
      status: "未开始",
      homeTeam: "荷兰",
      awayTeam: "德国",
      homeFlagCode: "nl",
      awayFlagCode: "de",
    },
    {
      matchId: "match-007",
      time: "06/24 20:30",
      status: "未开始",
      homeTeam: "韩国",
      awayTeam: "澳大利亚",
      homeFlagCode: "kr",
      awayFlagCode: "au",
    },
    {
      matchId: "match-008",
      time: "06/25 18:30",
      status: "未开始",
      homeTeam: "摩洛哥",
      awayTeam: "尼日利亚",
      homeFlagCode: "ma",
      awayFlagCode: "ng",
    },
    {
      matchId: "match-009",
      time: "06/26 22:00",
      status: "未开始",
      homeTeam: "克罗地亚",
      awayTeam: "瑞士",
      homeFlagCode: "hr",
      awayFlagCode: "ch",
    },
    {
      matchId: "match-010",
      time: "06/27 16:00",
      status: "未开始",
      homeTeam: "墨西哥",
      awayTeam: "加拿大",
      homeFlagCode: "mx",
      awayFlagCode: "ca",
    },
    {
      matchId: "match-011",
      time: "06/28 20:45",
      status: "未开始",
      homeTeam: "卡塔尔",
      awayTeam: "伊朗",
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
      const prefab = await this.loadMatchItemPrefab();

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
        this.bindActionButton(card, example);
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

  private loadMatchItemPrefab(): Promise<Prefab> {
    return new Promise((resolve, reject) => {
      resources.load("prefabs/MatchListItem", Prefab, (err, asset) => {
        if (err || !asset) {
          reject(err);
          return;
        }

        resolve(asset);
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

  private bindActionButton(card: Node, example: MatchExample): void {
    const actionButton = this.getNodeByPath(card, "ActionButton");
    if (!actionButton) {
      console.warn("[PredictionListController] ActionButton not found");
      return;
    }

    const button = actionButton.getComponent(Button);
    if (button) {
      button.interactable = true;
    }

    actionButton.off(Node.EventType.TOUCH_END);
    actionButton.on(Node.EventType.TOUCH_END, () => {
      setSelectedMatchInfo({
        matchId: example.matchId,
        homeCountryId: example.homeFlagCode,
        awayCountryId: example.awayFlagCode,
      });

      director.loadScene("DeckSelection", (err) => {
        if (err) {
          console.error(
            "[PredictionListController] Failed to load scene: DeckSelection",
            err,
          );
        }
      });
    });
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
