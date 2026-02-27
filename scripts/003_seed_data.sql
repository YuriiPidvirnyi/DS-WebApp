-- Seed data for Dental Story (Ukrainian dental clinic)

-- Insert doctors
INSERT INTO public.doctors (first_name, last_name, patronymic, specialization, experience_years, education, bio) VALUES
('Олена', 'Коваленко', 'Петрівна', 'Терапевт-стоматолог', 12, 'НМУ ім. О.О. Богомольця, 2012', 'Спеціалізується на лікуванні карієсу, пульпіту та естетичній реставрації зубів.'),
('Андрій', 'Мельник', 'Васильович', 'Хірург-стоматолог', 15, 'НМАПО ім. П.Л. Шупика, 2009', 'Експерт з імплантації та складних хірургічних втручань.'),
('Марія', 'Шевченко', 'Олександрівна', 'Ортодонт', 8, 'УМСА, 2016', 'Спеціаліст з виправлення прикусу, працює з брекетами та елайнерами.'),
('Дмитро', 'Бондаренко', 'Ігорович', 'Ортопед-стоматолог', 10, 'НМУ ім. О.О. Богомольця, 2014', 'Майстер протезування, виготовлення коронок та вінірів.');

-- Insert services with Ukrainian pricing (UAH)
INSERT INTO public.services (name_uk, name_en, description_uk, description_en, category, price_uah, duration_minutes) VALUES
-- Терапевтична стоматологія
('Консультація стоматолога', 'Dental Consultation', 'Огляд, діагностика, план лікування', 'Examination, diagnosis, treatment plan', 'Консультація', 0, 30),
('Лікування карієсу (1 поверхня)', 'Cavity Treatment (1 surface)', 'Лікування початкового карієсу', 'Initial cavity treatment', 'Терапія', 850, 45),
('Лікування карієсу (2+ поверхні)', 'Cavity Treatment (2+ surfaces)', 'Лікування середнього та глибокого карієсу', 'Medium and deep cavity treatment', 'Терапія', 1200, 60),
('Лікування пульпіту', 'Pulpitis Treatment', 'Ендодонтичне лікування каналів', 'Root canal treatment', 'Терапія', 2500, 90),
('Професійна чистка зубів', 'Professional Cleaning', 'Ультразвукова чистка + Air Flow + полірування', 'Ultrasonic cleaning + Air Flow + polishing', 'Гігієна', 1500, 60),

-- Хірургічна стоматологія
('Видалення зуба (простое)', 'Simple Extraction', 'Видалення рухомого зуба', 'Mobile tooth extraction', 'Хірургія', 800, 30),
('Видалення зуба (складне)', 'Complex Extraction', 'Видалення зуба мудрості або ретинованого', 'Wisdom or impacted tooth extraction', 'Хірургія', 2000, 60),
('Імплантація (Straumann)', 'Dental Implant (Straumann)', 'Встановлення імпланту Straumann (Швейцарія)', 'Straumann implant installation (Switzerland)', 'Імплантація', 25000, 90),
('Імплантація (MIS)', 'Dental Implant (MIS)', 'Встановлення імпланту MIS (Ізраїль)', 'MIS implant installation (Israel)', 'Імплантація', 18000, 90),

-- Ортопедична стоматологія
('Металокерамічна коронка', 'Metal-Ceramic Crown', 'Коронка на металевому каркасі', 'Crown on metal frame', 'Ортопедія', 4500, 60),
('Цирконієва коронка', 'Zirconia Crown', 'Безметалева коронка з діоксиду цирконію', 'Metal-free zirconia crown', 'Ортопедія', 8000, 60),
('Вінір керамічний', 'Ceramic Veneer', 'Керамічна накладка на передній зуб', 'Ceramic overlay for front tooth', 'Ортопедія', 12000, 60),

-- Ортодонтія
('Брекет-система (металева)', 'Metal Braces', 'Встановлення металевих брекетів на 1 щелепу', 'Metal braces installation (1 jaw)', 'Ортодонтія', 15000, 90),
('Брекет-система (керамічна)', 'Ceramic Braces', 'Встановлення керамічних брекетів на 1 щелепу', 'Ceramic braces installation (1 jaw)', 'Ортодонтія', 22000, 90),
('Елайнери (курс)', 'Clear Aligners', 'Повний курс лікування елайнерами', 'Full aligner treatment course', 'Ортодонтія', 45000, 60);

-- Insert working hours (Ukrainian clinic hours)
INSERT INTO public.working_hours (day_of_week, open_time, close_time, is_closed) VALUES
(0, NULL, NULL, true),           -- Неділя - вихідний
(1, '09:00', '20:00', false),    -- Понеділок
(2, '09:00', '20:00', false),    -- Вівторок
(3, '09:00', '20:00', false),    -- Середа
(4, '09:00', '20:00', false),    -- Четвер
(5, '09:00', '20:00', false),    -- П'ятниця
(6, '10:00', '16:00', false);    -- Субота

-- Insert sample reviews
INSERT INTO public.reviews (rating, comment, is_approved, is_featured) VALUES
(5, 'Чудова клініка! Лікар Олена Петрівна дуже професійна та уважна. Лікування пройшло безболісно.', true, true),
(5, 'Нарешті знайшов свого стоматолога. Андрій Васильович майстерно провів імплантацію. Рекомендую!', true, true),
(4, 'Гарний сервіс, привітний персонал. Трохи довго чекав на прийом, але результатом задоволений.', true, false),
(5, 'Донька боялася стоматологів, але тут їй дуже сподобалось. Тепер ходимо всією сім`єю.', true, true),
(5, 'Професійна чистка зубів - найкраща в місті! Зуби як нові.', true, false);
