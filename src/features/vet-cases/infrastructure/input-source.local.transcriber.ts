import { ContentLocationService } from '../../../domain';
import {
  TranscribedInputSource,
  TranscribingInputSource,
} from '../domain/entities/case-input';
import { InputSourceTranscriber } from '../domain/input-source.service';

export class InputSourceLocalTranscriber implements InputSourceTranscriber {
  constructor(
    private readonly contentLocationService: ContentLocationService,
  ) {}
  async transcribe(
    inputSource: TranscribingInputSource,
  ): Promise<TranscribedInputSource> {
    return {
      ...inputSource,
      status: 'transcribed',
      transcription: `Dr. Smith (00:00 – 00:15):
Good afternoon, Ms. Lee. I’m Dr. Smith. I understand Luna has been vomiting. Could you tell me a bit more about what’s going on?

Ms. Lee (00:16 – 00:30):
Yes, of course. She started vomiting late last night, around 10:00 p.m. She’s thrown up a few times since then—maybe three or four times total.

Dr. Smith (00:31 – 00:55):
I see. Could you describe the vomit for me? The color, consistency—anything you noticed?

Ms. Lee (00:56 – 01:10):
It looked mostly like undigested food the first time, kind of brownish. Then it was a bit more liquid the second and third times, with some yellowish color.

Dr. Smith (01:11 – 01:35):
All right. Have you noticed any other symptoms, such as diarrhea, changes in appetite or drinking habits, lethargy, or hiding behavior?

Ms. Lee (01:36 – 01:50):
She’s been a bit quieter than usual, not really playful. She hasn't had diarrhea that I’ve seen, but she doesn't seem interested in food this morning.

Dr. Smith (01:51 – 02:10):
Understood. Has she had any changes to her diet recently? Any new treats or foods, or did she get into anything she shouldn’t have?

Ms. Lee (02:11 – 02:25):
Well, I gave her a new brand of canned food yesterday morning—she seemed to like it, but that’s the only change I can think of.

Dr. Smith (02:26 – 02:40):
Got it. Has Luna been going outside at all? Any chance she could have eaten a plant or something else outdoors?

Ms. Lee (02:41 – 02:55):
She’s an indoor cat, so I don’t think so. I keep my houseplants out of her reach.

Dr. Smith (02:56 – 03:15):
Okay, that’s helpful. And how old is Luna, and does she have any known medical history—previous illnesses, surgeries, or allergies?

Ms. Lee (03:16 – 03:40):
She’s almost four years old. She’s had no major health issues. She had her vaccines updated about six months ago. She’s been pretty healthy overall.

Dr. Smith (03:41 – 04:05):
Excellent. And what about her deworming or flea prevention schedule? Is she current on those?

Ms. Lee (04:06 – 04:20):
Yes, she’s up to date on her monthly flea and tick preventative, and she was dewormed about three months ago.

Dr. Smith (04:21 – 04:55):
Great. Thank you for all that information. Given that she’s been vomiting multiple times in the last twelve hours, we’ll want to do a quick physical exam and possibly run some tests—like blood work—to check for any underlying issues such as infection or kidney problems. We might also consider an X-ray if we suspect any blockage. But let’s start with the basics.

Ms. Lee (04:56 – 05:10):
Sure, that sounds good. Whatever we need to do to help her feel better.

Dr. Smith (05:11 – 05:30):
All right. We’ll proceed with the exam now and then discuss next steps based on the findings. Let’s help Luna get comfortable on the exam table.`,
    };
  }
}
