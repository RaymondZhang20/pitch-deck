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
  ScrollBar,
  ScrollView,
  Size,
  Sprite,
  UITransform,
  Vec3,
  Widget,
} from "cc";
import { hasSavedDeckState } from "./DeckSelectionState";
import { showDialog } from "./DialogUtils";
import { setFlagByCode } from "./FlagUtils";
import { fetchMatchList, MatchInfo, MatchStatusKey } from "./MatchApi";
import { withLoadingOverlay } from "./LoadingOverlay";
import { setSelectedMatchInfo } from "./MatchSelectionState";
import { SegmentedControl } from "./SegmentedControl";

const { ccclass, property } = _decorator;
const MATCH_ITEM_SPACING_Y = 50;
const MATCH_ITEM_CONTENT_NAME = "MatchItemContent";

const STATUS_TABS: Array<{ key: MatchStatusKey; label: string }> = [
  { key: "not-started", label: "未开始" },
  { key: "in-progress", label: "进行中" },
  { key: "finished", label: "已结束" },
];

@ccclass("HistoryListController")
export class HistoryListController extends Component {
  @property(Node)
  public returnBtn: Node | null = null;

  private selectedStatus: MatchStatusKey = "not-started";
  private matchPrefab: Prefab | null = null;
  private segmentedControlNode: Node | null = null;
  private segmentedControl: SegmentedControl | null = null;
  private emptyLabelNode: Node | null = null;
  private errorLabelNode: Node | null = null;
  private matches: MatchInfo[] = [];
  private matchApiFailed = false;

  onLoad(): void {
    this.bindEvents();
    const canvas = this.node.parent;
    if (!canvas) {
      return;
    }

    void withLoadingOverlay(canvas, () => this.setupPage());
  }

  onDestroy(): void {
    if (this.returnBtn && isValid(this.returnBtn)) {
      this.returnBtn.off(Node.EventType.TOUCH_END, this.onClickReturnBtn, this);
    }
    if (this.errorLabelNode && isValid(this.errorLabelNode)) {
      this.errorLabelNode.off(
        Node.EventType.TOUCH_END,
        this.reloadCurrentScene,
        this,
      );
    }

    this.unbindSegmentedControl();
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

  private async setupPage(): Promise<void> {
    try {
      this.matchPrefab = await this.loadMatchItemPrefab();
      this.matches = await this.loadMatchesFromApi();
      await this.setupSegmentedControl();
      await this.renderFilteredMatches();
    } catch (error) {
      console.error("[HistoryListController] Failed to setup page", error);
    }
  }

  private async setupSegmentedControl(): Promise<void> {
    const canvas = this.node.parent;
    const filterBar = canvas?.getChildByName("filterBar");
    if (!filterBar) {
      console.warn("[HistoryListController] filterBar node was not found");
      return;
    }

    const prefab = await this.loadSegmentedControlPrefab();
    filterBar.removeAllChildren();

    const segmentedControl = instantiate(prefab);
    segmentedControl.name = "SegmentedControl";
    filterBar.addChild(segmentedControl);
    segmentedControl.setPosition(Vec3.ZERO);
    filterBar.setSiblingIndex(filterBar.parent?.children.length ?? 0);
    this.segmentedControlNode = segmentedControl;
    this.segmentedControl =
      segmentedControl.getComponent(SegmentedControl) ??
      segmentedControl.addComponent(SegmentedControl);

    this.bindSegmentedControl(segmentedControl);
    this.updateSegmentedControlState(false);
  }

  private bindSegmentedControl(segmentedControl: Node): void {
    const tabs = segmentedControl.getChildByName("Tabs");
    if (!tabs) {
      return;
    }

    for (let index = 0; index < STATUS_TABS.length; index += 1) {
      const tab = tabs.getChildByName(`Tab_${index}`);
      if (!tab) {
        continue;
      }

      const onTabClick = (): void => {
        this.selectStatus(STATUS_TABS[index].key);
      };

      tab.off(Node.EventType.TOUCH_END);
      tab.on(Node.EventType.TOUCH_END, onTabClick);

      const button = tab.getComponent(Button);
      if (button) {
        tab.off(Button.EventType.CLICK);
        tab.on(Button.EventType.CLICK, onTabClick);
      }
    }
  }

  private unbindSegmentedControl(): void {
    const tabs = this.segmentedControlNode?.getChildByName("Tabs");
    if (!tabs) {
      return;
    }

    for (let index = 0; index < STATUS_TABS.length; index += 1) {
      const tab = tabs.getChildByName(`Tab_${index}`);
      tab?.off(Node.EventType.TOUCH_END);
      tab?.off(Button.EventType.CLICK);
    }
  }

  private selectStatus(status: MatchStatusKey): void {
    if (this.selectedStatus === status) {
      return;
    }

    this.selectedStatus = status;
    this.updateSegmentedControlState(true);
    void this.renderFilteredMatches();
  }

  private updateSegmentedControlState(animated = true): void {
    const tabs = this.segmentedControlNode?.getChildByName("Tabs");
    if (!tabs) {
      return;
    }

    const selectedIndex = STATUS_TABS.findIndex(
      (tab) => tab.key === this.selectedStatus,
    );
    this.segmentedControl?.setSelectedIndex(selectedIndex, animated);

    for (let index = 0; index < STATUS_TABS.length; index += 1) {
      const tab = tabs.getChildByName(`Tab_${index}`);
      const label = tab?.getChildByName("Label")?.getComponent(Label);
      if (label) {
        label.string = STATUS_TABS[index].label;
      }
    }
  }

  private async renderFilteredMatches(): Promise<void> {
    const matchItemContent = this.ensureMatchItemList();
    if (!matchItemContent || !this.matchPrefab) {
      return;
    }

    matchItemContent.removeAllChildren();

    const matches = this.matches.filter(
      (example) => example.statusKey === this.selectedStatus,
    );

    this.setErrorStateVisible(this.matchApiFailed);
    this.setEmptyStateVisible(matches.length === 0);
    if (this.matchApiFailed) {
      this.resetMatchListScrollToTop(matchItemContent);
      return;
    }

    const cards = matches.map((_, index) => {
      const card = instantiate(this.matchPrefab as Prefab);
      card.name = `HistoryMatchItem${index + 1}`;
      return card;
    });

    this.updateMatchItemContentSize(
      matchItemContent,
      cards.length,
      cards[0] ?? null,
    );

    for (let i = 0; i < matches.length; i += 1) {
      const example = matches[i];
      const card = cards[i];
      this.positionMatchCardBeforeLayout(matchItemContent, card, i);
      matchItemContent.addChild(card);
      this.configureTeamInfoLayout(card);

      this.setLabel(card, "TimeLabel", example.time);
      this.setLabel(card, "StatusTag", example.status);
      this.setLabel(card, "StatusLabel", example.status);
      this.setLabel(card, "HomeTeamInfo/Name", example.homeTeam);
      this.setLabel(card, "AwayTeamInfo/Name", example.awayTeam);
      this.setLabel(
        card,
        "ActionButton/Label",
        example.statusKey === "finished" ? "查看分数" : "查看卡组",
      );
      await this.trySetFlag(card, "HomeTeamInfo/Flag", example.homeFlagCode);
      await this.trySetFlag(card, "AwayTeamInfo/Flag", example.awayFlagCode);
      this.bindActionButton(card, example);
    }

    this.resetMatchListScrollToTop(matchItemContent);
  }

  private setEmptyStateVisible(visible: boolean): void {
    const canvas = this.node.parent;
    if (!canvas) {
      return;
    }

    if (!this.emptyLabelNode) {
      this.emptyLabelNode = new Node("EmptyMatchTip");
      canvas.addChild(this.emptyLabelNode);
      this.emptyLabelNode.setPosition(new Vec3(0, 260, 0));

      const transform = this.emptyLabelNode.addComponent(UITransform);
      transform.setContentSize(new Size(640, 90));

      const label = this.emptyLabelNode.addComponent(Label);
      label.string = "暂时还没有比赛呦";
      label.fontSize = 34;
      label.lineHeight = 42;
      label.horizontalAlign = Label.HorizontalAlign.CENTER;
      label.verticalAlign = Label.VerticalAlign.CENTER;
    }

    this.emptyLabelNode.active = visible && !this.matchApiFailed;
  }

  private setErrorStateVisible(visible: boolean): void {
    const canvas = this.node.parent;
    if (!canvas) {
      return;
    }

    if (!this.errorLabelNode) {
      this.errorLabelNode = new Node("MatchApiErrorTip");
      canvas.addChild(this.errorLabelNode);
      this.errorLabelNode.setPosition(new Vec3(0, 260, 0));

      const transform = this.errorLabelNode.addComponent(UITransform);
      transform.setContentSize(new Size(640, 90));

      const label = this.errorLabelNode.addComponent(Label);
      label.string = "服务器链接异常，点我刷新";
      label.fontSize = 34;
      label.lineHeight = 42;
      label.horizontalAlign = Label.HorizontalAlign.CENTER;
      label.verticalAlign = Label.VerticalAlign.CENTER;

      this.errorLabelNode.on(Node.EventType.TOUCH_END, this.reloadCurrentScene, this);
    }

    this.errorLabelNode.active = visible;
  }

  private ensureMatchItemList(): Node | null {
    const canvas = this.node.parent;
    if (!canvas) {
      return null;
    }

    const matchItemList =
      canvas.getChildByName("MatchItemList") ??
      canvas.getChildByName("MatchScrollView")?.getChildByName("MatchItemList") ??
      null;
    if (!matchItemList) {
      return null;
    }

    canvas.getChildByName("filterBar")?.setSiblingIndex(canvas.children.length);

    const layout = matchItemList.getComponent(Layout);
    if (layout) {
      layout.enabled = false;
    }

    let mask = matchItemList.getComponent(Mask);
    if (!mask) {
      mask = matchItemList.addComponent(Mask);
    }
    mask.enabled = true;

    let scrollView = matchItemList.getComponent(ScrollView);
    if (!scrollView) {
      scrollView = matchItemList.addComponent(ScrollView);
    }
    scrollView.horizontal = false;
    scrollView.vertical = true;
    scrollView.inertia = false;
    scrollView.brake = 0.35;
    scrollView.elastic = true;
    scrollView.cancelInnerEvents = true;

    const scrollBar = matchItemList.getComponent(ScrollBar);
    if (scrollBar) {
      scrollView.verticalScrollBar = scrollBar;
    }

    let content = matchItemList.getChildByName(MATCH_ITEM_CONTENT_NAME);
    if (!content) {
      content = new Node(MATCH_ITEM_CONTENT_NAME);
      matchItemList.addChild(content);
    }

    let contentTransform = content.getComponent(UITransform);
    if (!contentTransform) {
      contentTransform = content.addComponent(UITransform);
    }

    const viewportTransform = matchItemList.getComponent(UITransform);
    const viewportWidth = viewportTransform?.contentSize.width ?? 0;
    const viewportHeight = viewportTransform?.contentSize.height ?? 0;
    contentTransform.setAnchorPoint(0.5, 1);
    contentTransform.setContentSize(new Size(viewportWidth, viewportHeight));
    content.setPosition(new Vec3(0, viewportHeight / 2, 0));

    scrollView.content = content;
    return content;
  }

  private positionMatchCardBeforeLayout(
    matchItemList: Node,
    card: Node,
    index: number,
  ): void {
    const cardTransform = card.getComponent(UITransform);
    const cardHeight = cardTransform?.contentSize.height ?? 0;
    const y = -(cardHeight / 2) - index * (cardHeight + MATCH_ITEM_SPACING_Y);

    card.setPosition(new Vec3(0, y, 0));
  }

  private updateMatchItemContentSize(
    matchItemContent: Node,
    itemCount: number,
    sampleCard: Node | null,
  ): void {
    const viewport = matchItemContent.parent;
    const viewportTransform = viewport?.getComponent(UITransform);
    const contentTransform = matchItemContent.getComponent(UITransform);
    const cardHeight =
      sampleCard?.getComponent(UITransform)?.contentSize.height ?? 0;
    const viewportWidth = viewportTransform?.contentSize.width ?? 0;
    const viewportHeight = viewportTransform?.contentSize.height ?? 0;
    const totalHeight =
      itemCount > 0
        ? itemCount * cardHeight + (itemCount - 1) * MATCH_ITEM_SPACING_Y
        : viewportHeight;

    contentTransform?.setContentSize(
      new Size(viewportWidth, Math.max(viewportHeight, totalHeight)),
    );
    matchItemContent.setPosition(new Vec3(0, viewportHeight / 2, 0));
  }

  private resetMatchListScrollToTop(matchItemContent: Node): void {
    const scrollView = matchItemContent.parent?.getComponent(ScrollView);
    if (!scrollView) {
      return;
    }

    scrollView.stopAutoScroll();
    this.scheduleOnce(() => {
      if (!isValid(scrollView)) {
        return;
      }

      scrollView.stopAutoScroll();
      scrollView.scrollToTop(0);
    }, 0);
  }

  private loadMatchItemPrefab(): Promise<Prefab> {
    return this.loadPrefab("prefabs/MatchListItem");
  }

  private loadSegmentedControlPrefab(): Promise<Prefab> {
    return this.loadPrefab("prefabs/SegmentedControl");
  }

  private loadPrefab(path: string): Promise<Prefab> {
    return new Promise((resolve, reject) => {
      resources.load(path, Prefab, (err, asset) => {
        if (err || !asset) {
          reject(err ?? new Error(`Failed to load prefab at ${path}`));
          return;
        }

        resolve(asset);
      });
    });
  }

  private async loadMatchesFromApi(): Promise<MatchInfo[]> {
    try {
      this.matchApiFailed = false;
      return this.sortMatchesByTime(await fetchMatchList());
    } catch (error) {
      this.matchApiFailed = true;
      console.error(
        "[HistoryListController] Failed to fetch matches from API",
        error,
      );
      return [];
    }
  }

  private sortMatchesByTime(matches: MatchInfo[]): MatchInfo[] {
    return [...matches].sort(
      (left, right) => this.parseMatchTime(left.time) - this.parseMatchTime(right.time),
    );
  }

  private parseMatchTime(time: string): number {
    const matched = time.match(/^(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
    if (!matched) {
      return Number.MAX_SAFE_INTEGER;
    }

    const [, month, day, hour, minute] = matched;
    return (
      Number(month) * 1000000 +
      Number(day) * 10000 +
      Number(hour) * 100 +
      Number(minute)
    );
  }

  private reloadCurrentScene(): void {
    const sceneName = director.getScene()?.name ?? "HistoryList";
    director.loadScene(sceneName);
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
      console.warn("[HistoryListController] Flag sprite target not found", path);
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
        "[HistoryListController] Failed to set flag",
        { path, code },
        error,
      );
    }
  }

  private bindActionButton(card: Node, example: MatchInfo): void {
    const actionButton = this.getNodeByPath(card, "ActionButton");
    if (!actionButton) {
      console.warn("[HistoryListController] ActionButton not found");
      return;
    }

    const button = actionButton.getComponent(Button);
    if (button) {
      button.interactable = true;
    }

    actionButton.off(Node.EventType.TOUCH_END);
    actionButton.on(Node.EventType.TOUCH_END, () => {
      void this.handleOpenMatch(example);
    });
  }

  private async handleOpenMatch(example: MatchInfo): Promise<void> {
    setSelectedMatchInfo({
      matchId: example.matchId,
      homeCountryId: example.homeFlagCode,
      awayCountryId: example.awayFlagCode,
      entryScene: "HistoryList",
    });

    const targetScene =
      example.statusKey === "finished" ? "ResultView" : "DeckView";
    if (hasSavedDeckState(example.matchId)) {
      director.loadScene(targetScene);
      return;
    }

    const canvas = this.node.parent;
    if (!canvas) {
      director.loadScene("DeckSelection");
      return;
    }

    await showDialog(canvas, {
      message: "这场比赛还没有组卡组，先去组卡吧",
      confirmLabel: "确定",
      onConfirm: () => {
        director.loadScene("DeckSelection");
      },
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
