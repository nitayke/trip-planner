import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { Activity, Flight, Lodging } from '../../../types/trip';

// Define functions/tools for Gemini
const tripFunctions: FunctionDeclaration[] = [
  {
    name: 'add_activity',
    description: 'הוספת פעילות, אטרקציה, מסעדה או נקודת עניין למסלול היומי',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        activityDate: {
          type: SchemaType.STRING,
          description: 'תאריך הפעילות בפורמט YYYY-MM-DD (למשל 2026-05-10)',
        },
        title: {
          type: SchemaType.STRING,
          description: 'שם הפעילות או המקום (למשל: ביקור בקולוסיאום, ארוחת ערב בפיצרייה)',
        },
        timeSlot: {
          type: SchemaType.STRING,
          description: 'שעה או חלק ביום (למשל: "10:30", "בוקר", "צהריים", "ערב")',
        },
        location: {
          type: SchemaType.STRING,
          description: 'מיקום, עיר או כתובת',
        },
        category: {
          type: SchemaType.STRING,
          description: 'קטגוריה: sightseeing, food, transport, relaxation, nature, shopping, attraction',
        },
        cost: {
          type: SchemaType.NUMBER,
          description: 'עלות משוערת בשקלים (אם ידוע, אחרת 0)',
        },
        description: {
          type: SchemaType.STRING,
          description: 'תיאור קצר, טיפים או הערות',
        },
      },
      required: ['activityDate', 'title'],
    },
  },
  {
    name: 'update_activity',
    description: 'עריכת פעילות קיימת (שינוי תאריך, שעה, שם, מיקום, קטגוריה, עלות או הערות). העדיפו לציין id מהרשימה',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: 'מזהה הפעילות מהרשימה (מועדף)' },
        title: { type: SchemaType.STRING, description: 'שם הפעילות הנוכחי, אם אין id' },
        currentDate: { type: SchemaType.STRING, description: 'התאריך הנוכחי של הפעילות YYYY-MM-DD, לבחירה בין פעילויות דומות' },
        newTitle: { type: SchemaType.STRING, description: 'שם חדש' },
        activityDate: { type: SchemaType.STRING, description: 'תאריך חדש YYYY-MM-DD' },
        timeSlot: { type: SchemaType.STRING, description: 'שעה חדשה או חלק ביום' },
        location: { type: SchemaType.STRING, description: 'מיקום חדש' },
        category: { type: SchemaType.STRING, description: 'קטגוריה: sightseeing, food, transport, relaxation, nature, shopping, attraction, other' },
        cost: { type: SchemaType.NUMBER, description: 'עלות בשקלים' },
        description: { type: SchemaType.STRING, description: 'תיאור או הערות' },
        status: { type: SchemaType.STRING, description: 'planned, completed או cancelled' },
      },
    },
  },
  {
    name: 'delete_activity',
    description: 'מחיקת פעילות מהמסלול לפי מזהה או כותרת',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: 'מזהה הפעילות מהרשימה (מועדף)' },
        title: {
          type: SchemaType.STRING,
          description: 'שם הפעילות או חלק ממנה למחיקה',
        },
        activityDate: {
          type: SchemaType.STRING,
          description: 'תאריך הפעילות (אופציונלי אך מומלץ)',
        },
      },
    },
  },
  {
    name: 'update_flight',
    description: 'עריכת טיסה קיימת (שעות, שדות תעופה, קוד הזמנה, מחיר וכו׳). העדיפו לציין id מהרשימה',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: 'מזהה הטיסה מהרשימה (מועדף)' },
        title: { type: SchemaType.STRING, description: 'מספר טיסה, חברה או שדה כדי לזהות את הטיסה, אם אין id' },
        airline: { type: SchemaType.STRING, description: 'חברת תעופה חדשה' },
        newFlightNumber: { type: SchemaType.STRING, description: 'מספר טיסה חדש' },
        departureAirport: { type: SchemaType.STRING, description: 'שדה המראה חדש' },
        arrivalAirport: { type: SchemaType.STRING, description: 'שדה נחיתה חדש' },
        departureTime: { type: SchemaType.STRING, description: 'זמן המראה חדש, למשל 2026-05-10T06:15:00' },
        arrivalTime: { type: SchemaType.STRING, description: 'זמן נחיתה חדש' },
        confirmationCode: { type: SchemaType.STRING, description: 'קוד הזמנה' },
        seat: { type: SchemaType.STRING, description: 'מקומות ישיבה' },
        price: { type: SchemaType.NUMBER, description: 'מחיר בשקלים' },
        notes: { type: SchemaType.STRING, description: 'הערות' },
      },
    },
  },
  {
    name: 'delete_flight',
    description: 'מחיקת טיסה',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: 'מזהה הטיסה מהרשימה (מועדף)' },
        title: { type: SchemaType.STRING, description: 'מספר טיסה, חברה או שדה כדי לזהות את הטיסה, אם אין id' },
      },
    },
  },
  {
    name: 'update_lodging',
    description: 'עריכת מלון או מקום לינה קיים (תאריכים, כתובת, מחיר, קוד אישור וכו׳). העדיפו לציין id מהרשימה',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: 'מזהה המלון מהרשימה (מועדף)' },
        name: { type: SchemaType.STRING, description: 'שם המלון הנוכחי, אם אין id' },
        newName: { type: SchemaType.STRING, description: 'שם חדש' },
        type: { type: SchemaType.STRING, description: 'סוג: hotel, airbnb, resort, apartment, other' },
        address: { type: SchemaType.STRING, description: 'כתובת חדשה' },
        checkInDate: { type: SchemaType.STRING, description: 'צ׳ק אין חדש YYYY-MM-DD' },
        checkOutDate: { type: SchemaType.STRING, description: 'צ׳ק אאוט חדש YYYY-MM-DD' },
        confirmationCode: { type: SchemaType.STRING, description: 'מספר אישור הזמנה' },
        price: { type: SchemaType.NUMBER, description: 'מחיר' },
        contactPhone: { type: SchemaType.STRING, description: 'טלפון' },
        bookingUrl: { type: SchemaType.STRING, description: 'קישור להזמנה' },
        notes: { type: SchemaType.STRING, description: 'הערות' },
      },
    },
  },
  {
    name: 'delete_lodging',
    description: 'מחיקת מלון או מקום לינה',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        id: { type: SchemaType.STRING, description: 'מזהה המלון מהרשימה (מועדף)' },
        name: { type: SchemaType.STRING, description: 'שם המלון, אם אין id' },
      },
    },
  },
  {
    name: 'add_flight',
    description: 'הוספת טיסה חדשה לרשימת הטיסות',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        airline: { type: SchemaType.STRING, description: 'שם חברת התעופה (למשל: אל על, Ryanair, Wizz)' },
        flightNumber: { type: SchemaType.STRING, description: 'מספר טיסה (למשל: LY385)' },
        departureAirport: { type: SchemaType.STRING, description: 'נמל תעופה ממריא (למשל: TLV נתב״ג)' },
        arrivalAirport: { type: SchemaType.STRING, description: 'נמל תעופה נוחת (למשל: FCO רומא)' },
        departureTime: { type: SchemaType.STRING, description: 'תאריך ושעת המראה (למשל: 2026-05-10T06:15:00)' },
        arrivalTime: { type: SchemaType.STRING, description: 'תאריך ושעת נחיתה (למשל: 2026-05-10T09:00:00)' },
        confirmationCode: { type: SchemaType.STRING, description: 'קוד הזמנה/כרטיס (PNR)' },
        seat: { type: SchemaType.STRING, description: 'מקומות ישיבה' },
        price: { type: SchemaType.NUMBER, description: 'מחיר כולל בשקלים' },
        notes: { type: SchemaType.STRING, description: 'הערות נוספות (כבודה וכו\')' },
      },
      required: ['airline', 'flightNumber', 'departureAirport', 'arrivalAirport', 'departureTime', 'arrivalTime'],
    },
  },
  {
    name: 'add_lodging',
    description: 'הוספת מלון, דירת Airbnb או מקום לינה',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: 'שם המלון או הדירה' },
        type: { type: SchemaType.STRING, description: 'סוג: hotel, airbnb, resort, apartment' },
        address: { type: SchemaType.STRING, description: 'כתובת או עיר' },
        checkInDate: { type: SchemaType.STRING, description: 'תאריך צ\'ק אין בפורמט YYYY-MM-DD' },
        checkOutDate: { type: SchemaType.STRING, description: 'תאריך צ\'ק אאוט בפורמט YYYY-MM-DD' },
        confirmationCode: { type: SchemaType.STRING, description: 'מספר אישור הזמנה' },
        price: { type: SchemaType.NUMBER, description: 'מחיר כולל' },
        notes: { type: SchemaType.STRING, description: 'הערות נוספות (כולל ארוחת בוקר וכו\')' },
      },
      required: ['name', 'address', 'checkInDate', 'checkOutDate'],
    },
  },
  {
    name: 'add_budget_item',
    description: 'הוספת שורת הוצאה או תקציב למעקב כספי',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: 'תיאור ההוצאה (למשל: השכרת רכב, מסעדת שף)' },
        category: { type: SchemaType.STRING, description: 'קטגוריה: flights, hotels, food, activities, shopping, transit, general' },
        estimatedCost: { type: SchemaType.NUMBER, description: 'עלות משוערת בש״ח' },
        actualCost: { type: SchemaType.NUMBER, description: 'עלות בפועל ששולמה' },
        paidBy: { type: SchemaType.STRING, description: 'מי שילם: "הוא", "היא", או "משותף"' },
      },
      required: ['title', 'category'],
    },
  },
  {
    name: 'add_packing_item',
    description: 'הוספת פריט לרשימת האריזה והציוד של בני הזוג',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: 'שם הפריט לאריזה' },
        category: { type: SchemaType.STRING, description: 'קטגוריה: בגדים, מסמכים וכרטיסים, אלקטרוניקה, רפואי וטואלטיקה, שונות' },
        assignedTo: { type: SchemaType.STRING, description: 'עבור מי הפריט: "הוא", "היא", או "שנינו"' },
      },
      required: ['title'],
    },
  },
  {
    name: 'toggle_packing_item',
    description: 'סימון פריט כנארז או כלא נארז',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: 'שם הפריט או חלק ממנו' },
        isPacked: { type: SchemaType.BOOLEAN, description: 'true אם נארז, false אם עדיין לא' },
      },
      required: ['title', 'isPacked'],
    },
  },
  {
    name: 'update_trip_info',
    description: 'עדכון פרטי הטיול הכלליים (יעד, תאריכים, כותרת, הערות)',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: 'שם הטיול' },
        destination: { type: SchemaType.STRING, description: 'יעד הטיול' },
        startDate: { type: SchemaType.STRING, description: 'תאריך התחלה YYYY-MM-DD' },
        endDate: { type: SchemaType.STRING, description: 'תאריך סיום YYYY-MM-DD' },
        notes: { type: SchemaType.STRING, description: 'הערות כלליות' },
      },
    },
  },
];

// One line per item, so the model can quote ids back in update/delete calls
function list<T>(items: T[] | undefined, line: (item: T) => string): string {
  return items && items.length > 0 ? items.map(line).join('\n') : '(אין)';
}

export async function POST(req: NextRequest) {
  try {
    const { messages, currentTripData } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: 'שגיאה: מפתח Google Gemini API אינו מוגדר בסביבה. אנא ודא שמשתנה GEMINI_API_KEY מוגדר.',
        actions: [],
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Use Gemini 3.8 Flash (free tier)
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      tools: [{ functionDeclarations: tripFunctions }],
    });

    const systemInstruction = `
אתה עוזר נסיעות חכם, חם ואמפתי המיועד לזוג (בעל ואישה) שמתכננים יחד טיול חלומי.
התפקיד שלך הוא להקשיב לבקשות שלהם, לענות על שאלות, להציע רעיונות וטיפים, ובעיקר: **לעדכן באופן אקטיבי את המערכת שלהם** בעזרת הכלים העומדים לרשותך (Function Calling).

הנתונים הנוכחיים של הטיול שלהם הם:
יעד וכותרת: ${currentTripData?.trip?.title} (${currentTripData?.trip?.destination})
תאריכים: ${currentTripData?.trip?.startDate} עד ${currentTripData?.trip?.endDate}
רשימת אריזה: ${currentTripData?.packingItems?.length || 0} פריטים

הפעילויות הקיימות (מזהה | תאריך | שעה | שם | מיקום):
${list(currentTripData?.activities, (a: Activity) => `${a.id} | ${a.activityDate} | ${a.timeSlot ?? ''} | ${a.title} | ${a.location ?? ''}`)}

הטיסות הקיימות (מזהה | מספר | חברה | מסלול | המראה):
${list(currentTripData?.flights, (f: Flight) => `${f.id} | ${f.flightNumber} | ${f.airline} | ${f.departureAirport} -> ${f.arrivalAirport} | ${f.departureTime}`)}

מקומות הלינה הקיימים (מזהה | שם | צ׳ק אין | צ׳ק אאוט):
${list(currentTripData?.lodgings, (l: Lodging) => `${l.id} | ${l.name} | ${l.checkInDate} | ${l.checkOutDate}`)}

הנחיות חשובות:
1. כאשר המשתמש מבקש להוסיף, לעדכן או למחוק משהו (פעילות, טיסה, מלון, פריט לאריזה, הוצאה בתקציב) - **הפעל תמיד את הפונקציה המתאימה**. לעריכה ומחיקה של פעילות, טיסה או מלון קיימים השתמש ב-id מהרשימות למעלה.
2. אם המשתמש לא מציין תאריך מדויק לפעילות, הסק אותו באופן הגיוני מתוך תאריכי הטיול (בין ${currentTripData?.trip?.startDate} ל-${currentTripData?.trip?.endDate}) או שאל בנימוס.
3. דבר תמיד בעברית טבעית, נעימה, קולחת ומסבירת פנים.
4. בסיום הפעולה, הסבר בקצרה ובחיוביות מה עודכן במערכת.
    `;

    // Format chat history for Gemini
    const contents: any[] = [
      {
        role: 'user',
        parts: [{ text: systemInstruction }],
      },
      {
        role: 'model',
        parts: [{ text: 'שלום! אני מוכן לעזור לכם לתכנן את הטיול המושלם ולעדכן את כל הנתונים במערכת בזמן אמת.' }],
      },
    ];

    for (const msg of messages) {
      if (msg.role === 'user') {
        contents.push({
          role: 'user',
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === 'assistant') {
        contents.push({
          role: 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    const result = await model.generateContent({
      contents,
    });

    const response = result.response;
    const candidates = response.candidates;
    const actions: any[] = [];
    let replyText = '';

    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.text) {
          replyText += part.text;
        }
        if (part.functionCall) {
          actions.push({
            name: part.functionCall.name,
            args: part.functionCall.args,
          });
        }
      }
    }

    if (!replyText && actions.length > 0) {
      replyText = 'ביצעתי את העדכון במערכת לבקשתך! תרצו להוסיף משהו נוסף? ✨';
    }

    return NextResponse.json({
      reply: replyText || 'קיבלתי, יש משהו נוסף שאוכל לעזור בו?',
      actions,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({
      reply: `הייתה שגיאה בתקשורת עם ה-AI: ${error?.message || error}`,
      actions: [],
    }, { status: 500 });
  }
}
