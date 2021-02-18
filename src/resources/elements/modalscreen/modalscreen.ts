import "./modalscreen.scss";
import { bindable, bindingMode, containerless, customElement } from "aurelia-framework";
import { AureliaHelperService } from "services/AureliaHelperService";
import { IDisposable } from "services/IDisposable";

/**
 * wrap this element around some content and set `onOff` to true when you want to disable and dim the contained content.
 */
@containerless
@customElement("modalscreen")
export class ModalScreen {

  @bindable public onOff: boolean;
  @bindable public message: string;

  private container: HTMLElement;
  private mask: HTMLElement;
  private subscription: IDisposable;

  constructor(
    private aureliaHelperService: AureliaHelperService,
  ) {
    window.onresize = () => this.onResize();
  }

  private onOffChanged(newValue, oldValue) {
    if (newValue && !oldValue) {
      this.showHide(true);
    } else if (!newValue && oldValue) {
      this.showHide(false);
    }
  }

  private onResize() {
    if (this.container) {
      const header = document.querySelector(".connectButton");
      this.mask.style.height = `${this.container.scrollHeight - header.scrollHeight}px`;
      this.mask.style.top = `${this.container.offsetTop + header.scrollHeight}px`;
    }
  }

  private showHide(onOff) {
    if (this.mask) {
      if (onOff) {
        this.onResize();
        this.mask.style.display = "flex";
        if (!this.subscription) {
          this.subscription = this.aureliaHelperService.createPropertyWatch(this.container, "scrollHeight", (newValue: boolean, oldValue: boolean) => {
            /**
             * catch when we've navigated
             */
            if (this.onOff && (newValue !== oldValue)) {
              this.onResize();
            }
          });
        }
      } else {
        this.mask.style.display = "none";
        if (this.subscription) {
          this.subscription.dispose();
          this.subscription = null;
        }
      }
    }
  }
  public attached(): void {
    this.showHide(this.onOff);
  }
}
