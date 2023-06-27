import {
  Component,
  ViewChild,
  TemplateRef,
  AfterViewInit,
  ViewContainerRef,
  OnDestroy,
} from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { parse } from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { ScheduleInterface } from './schedule';

interface CalendarDay {
  number: number;
  otherMonth: boolean;
}

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css'],
})
export class ScheduleComponent implements AfterViewInit, OnDestroy {
  @ViewChild(TemplateRef) _dialogTemplate: TemplateRef<any> | any;
  private isOpenDialog: boolean = false;
  private _overlayRef: OverlayRef;
  private _portal: TemplatePortal;
  public events: ScheduleInterface[] = [];

  scheduleForm: FormGroup = this.formBuilder.group(
    {
      title: [null, Validators.required],
      date: [null, Validators.required],
      initTime: [null, Validators.required],
      endTime: [null, Validators.required],
      description: [null],
    },
    { validators: this.endTimeValidator }
  );

  constructor(
    private _overlay: Overlay,
    private _viewContainerRef: ViewContainerRef,
    private toastr: ToastrService,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute
  ) {
    this._portal = new TemplatePortal(
      this._dialogTemplate,
      this._viewContainerRef
    );
    this._overlayRef = this._overlay.create({
      positionStrategy: this._overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      hasBackdrop: true,
    });
    this._overlayRef.backdropClick().subscribe(() => this._overlayRef.detach());
  }

  currentDate = new Date();
  calendar: CalendarDay[][] = [];
  currentYear: number = this.currentDate.getFullYear();
  currentMonth: string = '';

  ngOnInit(): void {
    // this.currentDate = new Date();
    // this.currentYear = currentDate.getFullYear();
    this.currentMonth = this.currentDate.toLocaleString('default', {
      month: 'long',
    });

    const overlayConfig = {
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      positionStrategy: this._overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically(),
    };

    this._overlayRef = this._overlay.create(overlayConfig);

    this.generateCalendar(this.currentDate);

    const { date, initTime } = this.activatedRoute.snapshot.queryParams;
    if (date && initTime) {
      this.scheduleForm.patchValue({ date, initTime });
    }
  }

  ngAfterViewInit() {
    this._portal = new TemplatePortal(
      this._dialogTemplate,
      this._viewContainerRef
    );
    this._overlayRef = this._overlay.create({
      positionStrategy: this._overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      hasBackdrop: true,
    });
    this._overlayRef.backdropClick().subscribe(() => this._overlayRef.detach());
  }

  ngOnDestroy() {
    this._overlayRef.dispose();
  }

  generateCalendar(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    let dayCounter = 1;
    this.calendar = [];

    for (let i = 0; i < 6; i++) {
      const week: CalendarDay[] = [];

      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < startingDay) {
          const prevMonth = new Date(year, month, 0);
          const prevMonthDays = prevMonth.getDate();

          const day: CalendarDay = {
            number: prevMonthDays - (startingDay - j - 1),
            otherMonth: true,
          };

          week.push(day);
        } else if (dayCounter > daysInMonth) {
          const nextMonthDay: CalendarDay = {
            number: dayCounter - daysInMonth,
            otherMonth: true,
          };

          week.push(nextMonthDay);
          dayCounter++;
        } else {
          const day: CalendarDay = {
            number: dayCounter,
            otherMonth: false,
          };

          week.push(day);
          dayCounter++;
        }
      }

      this.calendar.push(week);
    }
  }

  openDialog() {
    if (!this.isOpenDialog) {
      this._overlayRef = this._overlay.create({
        positionStrategy: this._overlay
          .position()
          .global()
          .centerHorizontally()
          .centerVertically(),
        hasBackdrop: true,
      });
      this._overlayRef.attach(
        new TemplatePortal(this._dialogTemplate, this._viewContainerRef)
      );
			this.isOpenDialog = true;
    }
  }

  closeDialog() {
		this.isOpenDialog = false;
    this._overlayRef.dispose();
  }

  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);

    this.generateCalendar(this.currentDate);
    this.currentMonth = this.currentDate.toLocaleString('default', {
      month: 'long',
    });
    this.currentYear = this.currentDate.getFullYear();
  }

  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);

    this.generateCalendar(this.currentDate);
    this.currentMonth = this.currentDate.toLocaleString('default', {
      month: 'long',
    });
    this.currentYear = this.currentDate.getFullYear();
    // this.currentDate.setFullYear(this.currentDate.getFullYear() + 1);
  }

  private endTimeValidator(control: AbstractControl) {
    const initTime = parse(control.get('initTime')?.value, 'HH:mm', Date.now());
    const endTime = parse(control.get('endTime')?.value, 'HH:mm', Date.now());

    if (initTime >= endTime) {
      return {
        timeError: 'The end hour must be greater than initial hour.',
      };
    }

    return null;
  }

  getEventsForDate(date: Date): any[] {
    const filteredEvents = this.events.filter((event) => {
      return event.date.toDateString() === date.toDateString();
    });

    return filteredEvents;
  }

  onSubmit() {
    if (this.scheduleForm.valid) {
      this.toastr.success('Successfully saved', '', {
        positionClass: 'toast-top-right',
      });
      console.log(this.scheduleForm.value);
      this.scheduleForm.reset();
      this.closeDialog();
    }
  }
}
