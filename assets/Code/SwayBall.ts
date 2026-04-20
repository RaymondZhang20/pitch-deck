import { _decorator, Component, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SwayBall')
export class SwayBall extends Component {
    @property
    amplitude: number = 50;        // 振幅（最大横移距离）

    @property
    period: number = 3;            // 周期（完整一次往复的秒数）

    private _startX: number = 0;
    private _timer: number = 0;

    start() {
        this._startX = this.node.position.x;
    }

    update(deltaTime: number) {
        // 累加时间
        this._timer += deltaTime;
        
        // 计算角频率 ω = 2π / T
        const angularSpeed = (2 * Math.PI) / this.period;
        
        // 位置公式：x = A * sin(ω * t)
        const offsetX = this.amplitude * Math.sin(angularSpeed * this._timer);
        
        // 应用位置
        const pos = this.node.position;
        this.node.setPosition(this._startX + offsetX, pos.y, pos.z);
        
        // 速度公式（仅用于调试，实际运动已由位置驱动）
        // const velocity = this.amplitude * angularSpeed * Math.cos(angularSpeed * this._timer);
        // console.log('当前速度:', velocity);
    }
}